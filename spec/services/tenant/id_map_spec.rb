require "rails_helper"

# Integer primary keys are reassigned on the way into a restore, so every column pointing at
# one has to be rewritten. The list of those columns is hand-written, and getting it wrong is
# silent: an unmapped reference keeps the archived number, which by now may belong to another
# tenant's row. Nothing raises; a mention simply points at the wrong thing.
#
# So the list is checked against the database. Four of its five entries are declared foreign
# keys and are derived here, which means a new one cannot be missed. The fifth is not declared
# anywhere, which is the whole reason it has to be written down -- and the reason this spec also
# checks that the undeclared set has not quietly grown.
RSpec.describe Tenant::IdMap do
  let(:conn) { ActiveRecord::Base.connection }

  def integer_keyed?(table)
    conn.columns(table).find { |c| c.name == "id" }&.type == :integer
  end

  # Every foreign key from an exported table to an exported table whose id gets reassigned.
  def declared_remappings
    Tenant::TableRegistry.exported.flat_map do |table|
      conn.foreign_keys(table).filter_map do |fk|
        next unless Tenant::TableRegistry.exported.include?(fk.to_table)
        next unless integer_keyed?(fk.to_table)

        [table, fk.column, fk.to_table]
      end
    end
  end

  it "names every declared foreign key whose target id is reassigned" do
    expect(described_class.constrained).to match_array(declared_remappings)
  end

  # The difference between the two lists is exactly the set no schema could have revealed.
  it "accounts for every entry the database does not declare" do
    undeclared = described_class::REMAPPED - declared_remappings

    expect(undeclared.map { |_, column, _| column }).to match_array(described_class::UNCONSTRAINED_COLUMNS)
  end

  it "points the undeclared columns at columns that still exist" do
    described_class::REMAPPED.each do |table, column, target|
      expect(conn.columns(table).map(&:name)).to include(column), "#{table}.#{column} is gone"
      expect(conn.tables).to include(target)
    end
  end

  # The drift that actually happened: object_comments was given a string primary key, which
  # retired object_references.source_comment_id from this list. An entry whose target no longer
  # reassigns its ids is not harmless -- it rewrites a column that did not need rewriting, and
  # IdMap#lookup returns nil for a row that was matched rather than inserted.
  it "lists no column whose target keeps its id across a restore" do
    stale = described_class::REMAPPED.reject { |_, _, target| integer_keyed?(target) }

    expect(stale).to eq([]),
      "these targets now have stable ids and no longer need remapping:\n  #{stale.join("\n  ")}"
  end
end
