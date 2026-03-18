require "rails_helper"

RSpec.describe ObjectReferenceReconciler do
  fixtures :organizations, :users, :documents, :spaces

  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }

  def mention_block(id:, entity:, entity_id:, title: "Test")
    {
      "id" => "block-1",
      "type" => "paragraph",
      "props" => {},
      "content" => [
        {
          "type" => "mention",
          "props" => {
            "id" => id,
            "entity" => entity,
            "entityId" => entity_id,
            "title" => title
          }
        }
      ],
      "children" => []
    }
  end

  def create_version(doc, blocks, created_by: users(:pawel), **attrs)
    doc.versions.create!(content_blocks: blocks, created_by: created_by, **attrs)
  end

  describe ".reconcile" do
    it "creates object_references for new mention nodes" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Two")]

      expect {
        create_version(document, blocks)
      }.to change(ObjectReference, :count).by(1)

      om = ObjectReference.find(uuid)
      expect(om.source_type).to eq("Document")
      expect(om.source_id).to eq(document.id)
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to eq(documents(:two).id)
      expect(om.title).to eq("Two")
      expect(om.current).to be true
      expect(om.organization_id).to eq(organization.id)
    end

    it "creates object_references for table mentions" do
      uuid = SecureRandom.uuid
      table = Table.first
      skip "No tables in test database" unless table
      blocks = [mention_block(id: uuid, entity: "table", entity_id: table.id, title: "Test Table")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om.target_type).to eq("Table")
      expect(om.target_id).to eq(table.id)
    end

    it "creates object_references for user mentions" do
      uuid = SecureRandom.uuid
      user = users(:stefan)
      blocks = [mention_block(id: uuid, entity: "user", entity_id: user.id, title: "Stefan")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om.target_type).to eq("User")
      expect(om.target_id).to eq(user.id)
    end

    it "updates existing object_reference to current: true when still present" do
      uuid = SecureRandom.uuid
      ObjectReference.create!(
        id: uuid,
        source: document,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        current: false,
        organization: organization
      )

      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]

      expect {
        create_version(document, blocks)
      }.not_to change(ObjectReference, :count)

      expect(ObjectReference.find(uuid).current).to be true
    end

    it "sets current: false for mentions removed from latest version" do
      uuid = SecureRandom.uuid
      blocks_v1 = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
      create_version(document, blocks_v1)

      expect(ObjectReference.find(uuid).current).to be true

      # Second version without the mention
      blocks_v2 = [{ "id" => "block-2", "type" => "paragraph", "content" => [], "children" => [] }]
      create_version(document, blocks_v2)

      expect(ObjectReference.find(uuid).current).to be false
    end

    it "creates broken mention when entityId points to nonexistent document" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "nonexistent_npi", title: "Gone Doc")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to be_nil
      expect(om.title).to eq("Gone Doc")
    end

    it "creates broken mention when entityId points to nonexistent table" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "table", entity_id: "nonexistent_npi", title: "Gone Table")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Table")
    end

    it "creates broken mention when entityId points to nonexistent user" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "user", entity_id: "nonexistent_id", title: "Gone User")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("User")
    end

    it "creates broken mention when entityId is empty string (import broken link)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "", title: "Unresolved Link")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om).to be_broken
      expect(om.title).to eq("Unresolved Link")
    end

    it "updates title from target object when target exists" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Old Title")]

      create_version(document, blocks)

      om = ObjectReference.find(uuid)
      expect(om.title).to eq(documents(:two).title)
    end

    it "preserves title from mention node when target does not exist" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "gone", title: "Original Title")]

      create_version(document, blocks)

      expect(ObjectReference.find(uuid).title).to eq("Original Title")
    end

    it "skips mention nodes with empty id" do
      blocks = [mention_block(id: "", entity: "document", entity_id: documents(:two).id)]

      expect {
        create_version(document, blocks)
      }.not_to change(ObjectReference, :count)
    end

    it "skips mention nodes with entityId of -1 (uninitialized)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: -1)]

      expect {
        create_version(document, blocks)
      }.not_to change(ObjectReference, :count)
    end

    it "is idempotent — running twice produces same result" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]

      version = create_version(document, blocks)
      expect {
        described_class.reconcile(document, version)
      }.not_to change(ObjectReference, :count)
    end

    it "sets source_version_id to the version's id" do
      uuid = SecureRandom.uuid
      version = document.versions.create!(
        content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
        created_by: users(:pawel)
      )

      ref = ObjectReference.find(uuid)
      expect(ref.source_version_id).to eq(version.id)
    end

    it "sets created_at to the version's created_at, not current time" do
      uuid = SecureRandom.uuid
      old_time = 3.days.ago.change(usec: 0)
      version = document.versions.create!(
        content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
        created_by: users(:pawel),
        created_at: old_time
      )

      ref = ObjectReference.find(uuid)
      expect(ref.created_at).to eq(old_time)
    end

    it "preserves source_version_id and created_at when mention reappears in newer version" do
      uuid = SecureRandom.uuid
      old_time = 3.days.ago.change(usec: 0)
      v1 = document.versions.create!(
        content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
        created_by: users(:pawel),
        created_at: old_time
      )

      # Newer version still has the same mention
      document.versions.create!(
        content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
        created_by: users(:pawel)
      )

      ref = ObjectReference.find(uuid)
      expect(ref.source_version_id).to eq(v1.id)
      expect(ref.created_at).to eq(old_time)
    end
  end

  context "advancedTable blocks" do
    let(:space) { spaces(:is_default) }
    let(:table) { Table.create!(name: "Test Table", organization: organization, space: space, parent: space) }

    def advanced_table_block(id:, table_npi: nil, table_id: nil)
      props = { "viewId" => "view1" }
      props["tableNpi"] = table_npi if table_npi
      props["tableId"] = table_id if table_id
      {
        "id" => id,
        "type" => "advancedTable",
        "props" => props,
        "children" => []
      }
    end

    it "creates object_reference for advancedTable block using tableNpi" do
      uuid = SecureRandom.uuid
      document.versions.create!(
        content_blocks: [advanced_table_block(id: uuid, table_npi: table.id)],
        created_by: users(:pawel)
      )

      ref = ObjectReference.find(uuid)
      expect(ref.target_type).to eq("Table")
      expect(ref.target_id).to eq(table.id)
      expect(ref.current).to be true
    end

    it "falls back to tableId when tableNpi is absent" do
      uuid = SecureRandom.uuid
      document.versions.create!(
        content_blocks: [advanced_table_block(id: uuid, table_id: table.id)],
        created_by: users(:pawel)
      )

      ref = ObjectReference.find(uuid)
      expect(ref.target_type).to eq("Table")
      expect(ref.target_id).to eq(table.id)
    end

    it "skips advancedTable blocks with blank table IDs" do
      uuid = SecureRandom.uuid
      expect {
        document.versions.create!(
          content_blocks: [advanced_table_block(id: uuid, table_npi: "", table_id: "")],
          created_by: users(:pawel)
        )
      }.not_to change(ObjectReference, :count)
    end

    it "creates broken reference for nonexistent table" do
      uuid = SecureRandom.uuid
      document.versions.create!(
        content_blocks: [advanced_table_block(id: uuid, table_npi: "nonexistent")],
        created_by: users(:pawel)
      )

      ref = ObjectReference.find(uuid)
      expect(ref).to be_broken
      expect(ref.target_type).to eq("Table")
    end
  end

  describe "Version callback integration" do
    fixtures :organizations, :users, :documents, :spaces, :versions

    it "triggers reconciliation when a version is created" do
      doc = documents(:one)
      uuid = SecureRandom.uuid
      blocks = [
        {
          "id" => "block-1",
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => uuid,
                "entity" => "document",
                "entityId" => documents(:two).id,
                "title" => "Two"
              }
            }
          ],
          "children" => []
        }
      ]

      expect {
        doc.versions.create!(content_blocks: blocks, created_by: users(:pawel))
      }.to change(ObjectReference, :count).by(1)

      om = ObjectReference.find(uuid)
      expect(om.source_id).to eq(doc.id)
      expect(om.target_id).to eq(documents(:two).id)
      expect(om.current).to be true
    end

    it "marks removed mentions as not current on new version" do
      doc = documents(:one)
      uuid = SecureRandom.uuid

      # First version with a mention
      blocks_v1 = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
      doc.versions.create!(content_blocks: blocks_v1, created_by: users(:pawel))
      expect(ObjectReference.find(uuid).current).to be true

      # Second version without the mention
      blocks_v2 = [{ "id" => "block-2", "type" => "paragraph", "content" => [], "children" => [] }]
      doc.versions.create!(content_blocks: blocks_v2, created_by: users(:pawel))
      expect(ObjectReference.find(uuid).current).to be false
    end
  end
end
