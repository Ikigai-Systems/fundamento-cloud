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
      space: space
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
        space: space
      )

      expect(Table.order(:created_at).last).to eq(new_table)
      expect(Table.last).to eq(new_table)
    end

    it "generates 10-character ID on create" do
      new_table = organization.tables.create!(
        name: "Test Table",
        space: space
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

  describe "object_reference cleanup on destroy" do
    let(:is_org) { organizations(:is) }
    let(:is_space) { spaces(:is_default) }

    it "nullifies target_id on object_references pointing to deleted table" do
      target_table = is_org.tables.create!(
        name: "Deletable Table",
        space: is_space
      )

      source_doc = documents(:one)

      om = ObjectReference.create!(
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

  # Mirrors the Document behaviour: a destroyed table leaves the references that
  # pointed at it marked broken, since nothing re-derives them from content now.
  describe "object references on destroy" do
    let(:document) { organization.documents.create!(title: "Refers to a table", space: space) }
    let!(:reference) do
      ObjectReference.create!(
        source_node_id: "table-ref-node",
        source: document,
        target_type: "Table",
        target_id: table.id,
        title: table.name,
        current: true,
        organization: organization
      )
    end

    it "nullifies the target of references pointing at it" do
      table.destroy!

      expect(reference.reload.target_id).to be_nil
      expect(reference.reload).to be_broken
    end

    it "deletes the references the table was the source of" do
      own_reference = ObjectReference.create!(
        source_node_id: "table-source-node",
        source: table,
        target_type: "Document",
        target_id: document.id,
        title: document.title,
        current: true,
        organization: organization
      )

      table.destroy!

      expect(ObjectReference.where(id: own_reference.id)).to be_empty
    end
  end
end
