require "rails_helper"

# The registry decides what a tenant export contains, so a table nobody classified is a
# table silently absent from every export -- and the moment you discover that is a
# restore, which is the worst possible moment.
#
# This is deliberately a completeness check rather than a test of behaviour: it fails the
# build when someone adds a table and does not say what it is, which is the only point at
# which the answer is cheap to give.
RSpec.describe Tenant::TableRegistry do
  let(:database_tables) { ActiveRecord::Base.connection.tables.sort }

  it "classifies every table in the database" do
    unclassified = database_tables - described_class.all_declared

    expect(unclassified).to eq([]),
      "these tables are not classified in Tenant::TableRegistry, so an export would " \
      "silently omit them: #{unclassified.join(', ')}"
  end

  it "does not classify tables that no longer exist" do
    stale = described_class.all_declared - database_tables

    expect(stale).to eq([]),
      "these tables are classified but no longer in the schema: #{stale.join(', ')}"
  end

  # Declaring the wrong parent does not fail loudly -- it produces an export that is
  # quietly missing rows, or carrying another tenant's. Where the database has a real
  # foreign key for the column, it has to point where the registry says it does.
  # Polymorphic columns have no constraint and are checked by the exporter's own specs.
  it "derives each table from the parent its foreign key actually references" do
    conn = ActiveRecord::Base.connection

    wrong = described_class::DERIVED.filter_map do |table, rule|
      fk = conn.foreign_keys(table).find { |k| k.column == rule[:foreign_key] }
      next if fk.nil?

      "#{table}.#{rule[:foreign_key]} -> #{fk.to_table} (registry says #{rule[:parent]})" if fk.to_table != rule[:parent]
    end

    expect(wrong).to eq([])
  end

  # The check above can only see columns the database constrains, and the one rule I got
  # wrong was in the blind spot: resource_owner_id looks like the tenant link on the oauth
  # tables and points at users instead, so the export would have contained no tokens and
  # reported nothing. This makes the blind spot explicit -- a new unconstrained rule fails
  # here until somebody adds it to UNCONSTRAINED, which means somebody has looked at it.
  it "keeps the list of unverifiable rules honest" do
    conn = ActiveRecord::Base.connection

    unconstrained = described_class::DERIVED.filter_map do |table, rule|
      table if conn.foreign_keys(table).none? { |k| k.column == rule[:foreign_key] }
    end

    expect(unconstrained).to match_array(described_class::UNCONSTRAINED),
      "a derived rule with no foreign key cannot be checked by this spec. Verify the " \
      "parent against real data, then add the table to TableRegistry::UNCONSTRAINED."
  end

  # The classification has to agree with the schema, or the export builds the wrong query:
  # a "direct" table is filtered on organization_id, and one without that column would
  # raise rather than quietly return everything -- but the reverse, a table that has the
  # column and is treated as derived, joins needlessly and can drift from the truth.
  it "only calls a table direct when it really has organization_id" do
    mismatched = described_class::DIRECT.reject do |table|
      ActiveRecord::Base.connection.columns(table).map(&:name).include?("organization_id")
    end

    expect(mismatched).to eq([])
  end

  it "does not treat a table with organization_id as derived" do
    mismatched = described_class::DERIVED.keys.select do |table|
      ActiveRecord::Base.connection.columns(table).map(&:name).include?("organization_id")
    end

    expect(mismatched).to eq([])
  end

  describe "EXCLUDED" do
    it "keeps its tables out of every archive" do
      expect(described_class.exported).not_to include(*described_class::EXCLUDED.keys)
    end

    # A renamed or dropped table would otherwise sit here forever, excluding nothing.
    it "names tables that exist" do
      expect(ActiveRecord::Base.connection.tables).to include(*described_class::EXCLUDED.keys)
    end

    it "gives a reason for each" do
      expect(described_class::EXCLUDED.values).to all(be_present)
    end

    # The point of the category: these belong to a tenant, unlike GLOBAL. If one stopped having
    # a route to an organization it would belong in GLOBAL instead, and the distinction this
    # category exists to draw would have quietly collapsed.
    it "excludes only tables that really are a tenant's" do
      described_class::EXCLUDED.each_key do |table|
        columns = ActiveRecord::Base.connection.columns(table).map(&:name)

        routed = columns.include?("organization_id") || columns.include?("import_session_id")

        expect(routed).to be(true),
          "#{table} has no route to an organization, so it is GLOBAL rather than EXCLUDED"
      end
    end
  end
end
