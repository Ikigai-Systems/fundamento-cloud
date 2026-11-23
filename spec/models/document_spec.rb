require "rails_helper"

RSpec.describe Document, type: :model do
  fixtures :organizations, :spaces, :documents, :object_references

  describe "#contributors" do
    fixtures :users, :organization_memberships, :document_editing_sessions

    it "returns unique users from editing sessions ordered by name" do
      document = documents(:one)
      contributors = document.contributors

      expect(contributors).to be_an(ActiveRecord::Relation)
      expect(contributors.map(&:display_name)).to eq(contributors.map(&:display_name).sort)
      expect(contributors.pluck(:id).uniq.length).to eq(contributors.length)
    end

    it "includes both editors and viewers" do
      document = documents(:one)
      contributors = document.contributors

      expect(contributors.map(&:id)).to include("user_pawel")
      expect(contributors.map(&:id)).to include("user_stefan")
    end

    it "returns empty relation when no editing sessions exist" do
      document = documents(:two)
      document.editing_sessions.delete_all

      expect(document.contributors).to be_empty
    end
  end

  describe "validations" do
    it "requires an organization" do
      document = Document.new(space_id: "is_default")
      expect(document.valid?).to be false
      expect(document.errors[:organization]).to include("must exist")
    end

    it "requires a space" do
      document = Document.new(organization: organizations(:is))
      expect(document.valid?).to be false
      expect(document.errors[:space]).to include("must exist")
    end
  end

  describe "object_reference cleanup on destroy" do
    let(:organization) { organizations(:is) }
    let(:source_doc) { documents(:one) }
    let(:target_doc) { documents(:two) }

    it "nullifies target_id on object_references pointing to deleted document" do
      om = ObjectReference.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      target_doc.space.remove_single_item_from_hierarchy!(target_doc.id)
      target_doc.destroy!

      om.reload
      expect(om.target_id).to be_nil
      expect(om.target_type).to eq("Document")
      expect(om.title).to eq("Target Doc")
    end

    it "deletes object_references where deleted document is the source" do
      om = ObjectReference.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      source_doc.space.remove_single_item_from_hierarchy!(source_doc.id)
      source_doc.destroy!

      expect(ObjectReference.exists?(om.id)).to be false
    end
  end

  # object_references is the only source for mentions and connections now, so a
  # destroyed document has to take its own references with it and leave the ones
  # pointing at it marked broken rather than dangling.
  describe "object references on destroy" do
    it "deletes the references the document was the source of" do
      document = documents(:one)

      expect { document.destroy! }
        .to change { ObjectReference.where(source_type: "Document", source_id: "one").count }
        .to(0)
    end

    it "nullifies the target of references pointing at it" do
      reference = object_references(:doc_mention_to_doc)
      expect(reference.target_id).to eq("two")

      documents(:two).destroy!

      expect(reference.reload.target_id).to be_nil
      expect(reference.reload).to be_broken
    end
  end

  # import_files.document_id is a foreign key with no cascade, and Document had no inverse
  # association -- so destroying an imported document raised ActiveRecord::InvalidForeignKey.
  # Every imported document was undeletable, and TrashPurgeJob could never purge one.
  describe "a document that came from an import" do
    fixtures :users, :organization_memberships

    it "can be destroyed, and the import record survives saying so" do
      document = documents(:one)
      session = ImportSession.create!(
        organization: document.organization, space: document.space,
        organization_membership: organization_memberships(:om_is_pawel),
        expires_at: 1.day.from_now
      )
      import_file = ImportFile.create!(
        import_session: session, document: document,
        relative_path: "note.md", file_type: :document, status: :completed
      )

      expect { document.destroy! }.not_to raise_error

      expect(import_file.reload.document_id).to be_nil
    end
  end

  describe "comments on blocks the document no longer has" do
    fixtures :users, :organization_memberships, :versions, :document_blocks

    let(:document) { documents(:two) }
    let(:removed_block_id) { "db948229-12cb-4357-92dc-94494df434ef" }

    def comment_on(block_id)
      document.comments.create!(
        organization: organizations(:is),
        organization_membership: organization_memberships(:om_is_pawel),
        content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "A comment"}]}],
        anchor_block_id: block_id
      )
    end

    def save_version_without_the_removed_block
      document.versions.create!(
        created_by: users(:pawel),
        content_blocks: document.current_blocks.reject { |block| block["id"] == removed_block_id }
      )
    end

    describe "#comment_quotes" do
      it "are what the comments on blocks quote, leaving out removed comments and those that quote nothing" do
        comment_on("initialBlockId").update!(anchor_quote: "kept words", anchor_prefix: "the ", anchor_suffix: " here")
        comment_on("initialBlockId")
        comment_on(removed_block_id).update!(anchor_quote: "gone", removed_at: Time.current)

        expect(document.comment_quotes)
          .to eq([{blockId: "initialBlockId", quote: "kept words", prefix: "the ", suffix: " here"}])
      end
    end

    describe "#orphaned_comments" do
      it "are the comments on blocks that are not in the current version" do
        on_kept_block = comment_on("initialBlockId")
        on_removed_block = comment_on(removed_block_id)
        on_document = document.comments.create!(
          organization: organizations(:is),
          organization_membership: organization_memberships(:om_is_pawel),
          content: [{"type" => "paragraph", "content" => []}]
        )

        expect(document.orphaned_comments).to be_empty

        save_version_without_the_removed_block

        expect(document.orphaned_comments).to contain_exactly(on_removed_block)
        expect(document.orphaned_comments).not_to include(on_kept_block, on_document)
      end
    end

    it "has no comments on removed blocks while it is a draft" do
      draft = documents(:one)
      draft.comments.create!(
        organization: organizations(:is),
        organization_membership: organization_memberships(:om_is_pawel),
        content: [{"type" => "paragraph", "content" => []}],
        anchor_block_id: "any-block"
      )

      expect(draft).to be_draft
      expect(draft.orphaned_comments).to be_empty
    end

    describe "#latest_versions_with_blocks" do
      it "names the latest version that still had each block" do
        first_version = document.versions.first
        latest_version = save_version_without_the_removed_block

        found = document.latest_versions_with_blocks([removed_block_id, "initialBlockId", "never-saved"])

        expect(found).to eq(removed_block_id => first_version, "initialBlockId" => latest_version)
      end
    end
  end
end
