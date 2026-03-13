require "rails_helper"

RSpec.describe ObjectMentionReconciler do
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

  describe ".reconcile" do
    it "creates object_mentions for new mention nodes" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Two")]

      expect {
        described_class.reconcile(document, blocks)
      }.to change(ObjectMention, :count).by(1)

      om = ObjectMention.find(uuid)
      expect(om.source_type).to eq("Document")
      expect(om.source_id).to eq(document.id)
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to eq(documents(:two).id)
      expect(om.title).to eq("Two")
      expect(om.current).to be true
      expect(om.organization_id).to eq(organization.id)
    end

    it "creates object_mentions for table mentions" do
      uuid = SecureRandom.uuid
      table = Table.first
      skip "No tables in test database" unless table
      blocks = [mention_block(id: uuid, entity: "table", entity_id: table.id, title: "Test Table")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.target_type).to eq("Table")
      expect(om.target_id).to eq(table.id)
    end

    it "creates object_mentions for user mentions" do
      uuid = SecureRandom.uuid
      user = users(:stefan)
      blocks = [mention_block(id: uuid, entity: "user", entity_id: user.id, title: "Stefan")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.target_type).to eq("User")
      expect(om.target_id).to eq(user.id)
    end

    it "updates existing object_mention to current: true when still present" do
      uuid = SecureRandom.uuid
      ObjectMention.create!(
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
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)

      expect(ObjectMention.find(uuid).current).to be true
    end

    it "sets current: false for mentions removed from latest version" do
      uuid = SecureRandom.uuid
      ObjectMention.create!(
        id: uuid,
        source: document,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        current: true,
        organization: organization
      )

      # Empty blocks — mention was removed
      described_class.reconcile(document, [])

      expect(ObjectMention.find(uuid).current).to be false
    end

    it "creates broken mention when entityId points to nonexistent document" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "nonexistent_npi", title: "Gone Doc")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to be_nil
      expect(om.title).to eq("Gone Doc")
    end

    it "creates broken mention when entityId points to nonexistent table" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "table", entity_id: "nonexistent_npi", title: "Gone Table")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Table")
    end

    it "creates broken mention when entityId points to nonexistent user" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "user", entity_id: "nonexistent_id", title: "Gone User")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("User")
    end

    it "creates broken mention when entityId is empty string (import broken link)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "", title: "Unresolved Link")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.title).to eq("Unresolved Link")
    end

    it "updates title from target object when target exists" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Old Title")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.title).to eq(documents(:two).title)
    end

    it "preserves title from mention node when target does not exist" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "gone", title: "Original Title")]

      described_class.reconcile(document, blocks)

      expect(ObjectMention.find(uuid).title).to eq("Original Title")
    end

    it "skips mention nodes with empty id" do
      blocks = [mention_block(id: "", entity: "document", entity_id: documents(:two).id)]

      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
    end

    it "skips mention nodes with entityId of -1 (uninitialized)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: -1)]

      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
    end

    it "is idempotent — running twice produces same result" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]

      described_class.reconcile(document, blocks)
      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
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
      }.to change(ObjectMention, :count).by(1)

      om = ObjectMention.find(uuid)
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
      expect(ObjectMention.find(uuid).current).to be true

      # Second version without the mention
      blocks_v2 = [{ "id" => "block-2", "type" => "paragraph", "content" => [], "children" => [] }]
      doc.versions.create!(content_blocks: blocks_v2, created_by: users(:pawel))
      expect(ObjectMention.find(uuid).current).to be false
    end
  end
end
