require "rails_helper"

RSpec.describe Table, type: :model do
  fixtures :organizations, :spaces, :documents

  let(:organization) { organizations(:hc) }
  let(:space) { spaces(:hc_default) }
  let!(:table) do
    Table.create!(
      id: "hctable001",
      name: "Sample Table",
      organization: organization,
      space: space,
      parent: space
    )
  end

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      expect(table.id).to be_a(String)
      expect(table.id.length).to eq(10)
    end

    it "can be found by string ID" do
      found_table = Table.find(table.id)
      expect(found_table).to eq(table)
    end

    it "orders by created_at with .last" do
      # Create a new table
      new_table = organization.tables.create!(
        name: "Newest Table",
        space: space,
        parent: space
      )

      expect(Table.order(:created_at).last).to eq(new_table)
      expect(Table.last).to eq(new_table)
    end

    it "generates 10-character ID on create" do
      new_table = organization.tables.create!(
        name: "Test Table",
        space: space,
        parent: space
      )

      expect(new_table.id).to be_a(String)
      expect(new_table.id.length).to eq(10)
    end

    it "has string table_id in child tables" do
      # Create a column for the table
      column = table.columns.create!(
        name: "Test Column",
        organization: organization,
        kind: :string
      )

      expect(column.table_id).to be_a(String)
      expect(column.table_id).to eq(table.id)
    end
  end

  describe "object_mention cleanup on destroy" do
    let(:is_org) { organizations(:is) }
    let(:is_space) { spaces(:is_default) }

    it "nullifies target_id on object_mentions pointing to deleted table" do
      target_table = is_org.tables.create!(
        name: "Deletable Table",
        space: is_space,
        parent: is_space
      )

      source_doc = documents(:one)

      om = ObjectMention.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Table",
        target_id: target_table.id,
        title: "Test Table",
        organization: is_org
      )

      target_table.destroy!

      om.reload
      expect(om.target_id).to be_nil
      expect(om.target_type).to eq("Table")
      expect(om.title).to eq("Test Table")
    end
  end

  describe "associations" do
    it "belongs to organization" do
      expect(table.organization).to eq(organization)
    end

    it "belongs to space" do
      expect(table.space).to eq(space)
    end

    it "has many columns" do
      expect(table).to respond_to(:columns)
    end

    it "has many rows" do
      expect(table).to respond_to(:rows)
    end

    it "has many cells" do
      expect(table).to respond_to(:cells)
    end
  end
end
