require "rails_helper"

# `audited enabled: false` reads as an opt-out but does nothing in audited 5.8.0:
# set_audited_options never looks at :enabled, and auditing_enabled is driven by
# Audited.store instead. Because ApplicationRecord calls `audited`, every model that
# believed it had opted out was in fact writing an audit row per write -- Tables::Cell on
# every cell edit. This locks the real opt-out in place.
RSpec.describe "opting a model out of auditing" do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", "tables/columns", "tables/rows"

  let(:organization) { organizations(:is) }
  let(:table) { tables_tables(:projects) }

  def audits_written_for(type)
    before = Audited::Audit.where(auditable_type: type).count
    yield
    Audited::Audit.where(auditable_type: type).count - before
  end

  it "keeps ApplicationRecord's default so ordinary models stay audited" do
    written = audits_written_for("Document") do
      documents(:one).update!(title: "Renamed")
    end

    expect(written).to eq(1)
  end

  describe "models that opt out" do
    it "writes nothing for Tables::Cell, the highest-volume case" do
      row = table.rows.first
      column = table.columns.first

      written = audits_written_for("Tables::Cell") do
        cell = row.cells.find_or_initialize_by(column: column)
        cell.update!(table: table, value: "first", organization: organization)
        cell.update!(value: "second")
      end

      expect(written).to eq(0)
    end

    it "writes nothing for Tables::Row" do
      written = audits_written_for("Tables::Row") { table.rows.create!(organization: organization) }

      expect(written).to eq(0)
    end

    it "writes nothing for Tables::Column" do
      written = audits_written_for("Tables::Column") do
        table.columns.create!(name: "Fresh", kind: :string, organization: organization)
      end

      expect(written).to eq(0)
    end

    it "writes nothing for ObjectVisitor" do
      written = audits_written_for("ObjectVisitor") do
        ObjectVisitor.create!(object: documents(:two), user: users(:stefan), visited_at: Time.current)
      end

      expect(written).to eq(0)
    end

    it "writes nothing for DocumentEditingSession" do
      written = audits_written_for("DocumentEditingSession") do
        DocumentEditingSession.create!(
          document: documents(:one),
          member: organization_memberships(:om_is_pawel),
          connected_at: Time.current
        )
      end

      expect(written).to eq(0)
    end
  end
end
