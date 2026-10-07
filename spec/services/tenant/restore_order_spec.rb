require "rails_helper"

# The order rows are inserted in has to satisfy 76 foreign keys. Getting it wrong does not
# produce a subtly wrong restore -- it produces a failed one, halfway through, on the day
# somebody needs it.
#
# So the order is written down once and checked against the database's own constraints
# rather than against anybody's memory of them. A foreign key added later, to a table that
# happens to sort earlier, fails here rather than in an incident.
RSpec.describe Tenant::RestoreOrder do
  let(:conn) { ActiveRecord::Base.connection }

  it "covers every exported table exactly once" do
    expect(described_class::TABLES.uniq).to eq(described_class::TABLES)
    expect(described_class::TABLES).to match_array(Tenant::TableRegistry.exported)
  end

  # The real assertion: for every foreign key between two exported tables, the table being
  # pointed at is inserted first -- unless the reference is explicitly deferred, meaning it
  # is written as NULL and filled in by a second pass.
  it "inserts every table after the tables it points at" do
    position = described_class::TABLES.each_with_index.to_h

    violations = Tenant::TableRegistry.exported.flat_map do |table|
      conn.foreign_keys(table).filter_map do |fk|
        next unless position.key?(fk.to_table)
        next if described_class.deferred?(table, fk.column)
        next if fk.to_table == table # self-reference, handled by chain-order inserts

        if position[table] < position[fk.to_table]
          "#{table}.#{fk.column} -> #{fk.to_table}: " \
            "#{table} is inserted at #{position[table]} but #{fk.to_table} only at #{position[fk.to_table]}"
        end
      end
    end

    expect(violations).to eq([]),
      "these foreign keys would be violated by the insertion order:\n  #{violations.join("\n  ")}"
  end

  # A deferred reference that no longer exists is worse than an undeclared one: it silently
  # switches off a check that is now needed elsewhere.
  it "only defers references that exist" do
    stale = described_class::DEFERRED.reject do |table, column|
      conn.columns(table).map(&:name).include?(column)
    end

    expect(stale).to eq([])
  end

  # Self-references cannot be satisfied by ordering tables -- the rows have to go in along
  # the chain. Naming them here is what stops somebody trying to solve it with ordering.
  it "names every self-referential column" do
    actual = Tenant::TableRegistry.exported.flat_map do |table|
      conn.foreign_keys(table).select { |fk| fk.to_table == table }.map { |fk| [table, fk.column] }
    end

    expect(described_class::CHAIN_ORDERED).to match_array(actual)
  end
end
