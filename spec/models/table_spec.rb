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

RSpec.describe Table, "#data_to_hash", type: :model do
  fixtures :organizations, :spaces, "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  # Rows are rendered as JSON by the formula API. A row holding both :id and "id" serialised
  # with "id" twice; json 3 refuses to generate that.
  it "gives each row a single id key" do
    rows = tables_tables(:projects).data_to_hash

    expect(rows).not_to be_empty
    rows.each { |row| expect(row.keys.count { |key| key.to_s == "id" }).to eq(1) }
    expect(JSON.parse(JSON.generate(rows)).map { |row| row["id"] }).to eq(rows.map { |row| row["id"] })
  end
end
