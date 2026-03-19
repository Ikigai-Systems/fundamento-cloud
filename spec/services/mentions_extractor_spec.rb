require "rails_helper"

RSpec.describe MentionsExtractor do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:stefan) }
  let(:author) { users(:pawel) }

  def unique_id(prefix = "id")
    "#{prefix}_#{SecureRandom.hex(6)}"
  end

  def mention_content(mention_id, entity:, entity_id:)
    [
      {
        "id" => unique_id("block"),
        "type" => "paragraph",
        "content" => [
          {
            "type" => "mention",
            "props" => {
              "id" => mention_id,
              "entity" => entity,
              "entityId" => entity_id,
              "title" => "Test"
            }
          }
        ],
        "children" => []
      }
    ]
  end

  def empty_content
    [{ "id" => unique_id("block"), "type" => "paragraph", "content" => [], "children" => [] }]
  end

  shared_examples "get_all_mentions behavior" do
    context "extracting user mentions from document versions" do
      let(:document) { documents(:one) }

      it "returns mentions targeting the specified user" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.mention_id).to eq(mention_id)
      end

      it "does not return mentions targeting a different user" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: author.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to be_empty
      end

      it "does not return document/table mentions" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "document", entity_id: documents(:two).id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to be_empty
      end

      it "sets created_at to the version timestamp where mention first appeared" do
        mention_id = unique_id("mention")
        old_time = 3.days.ago.change(usec: 0)
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: old_time
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.created_at).to eq(old_time)
      end

      it "sets object_title to the document title" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_title).to eq(document.title)
      end
    end

    context "current vs non-current mentions" do
      let(:document) { documents(:one) }

      it "links current mentions to document path" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_path).to include(document.id)
        expect(mentions.first.object_path).to include("mention-#{mention_id}")
        expect(mentions.first.object_path).not_to include("versions")
      end

      it "links non-current mentions to version path" do
        mention_id = unique_id("mention")

        # Version 1 has the mention
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: 3.days.ago
        )

        # Version 2 removes the mention — reconciler marks old mention as non-current
        document.versions.create!(
          content_blocks: empty_content,
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.object_path).to include("versions")
        expect(mentions.first.object_path).to include("mention-#{mention_id}")
      end
    end

    context "mentions from comments" do
      let(:document) { documents(:one) }
      let(:org_membership) { organization_memberships(:om_is_pawel) }

      it "includes mentions from document comments" do
        mention_id = unique_id("mention")
        ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: mention_content(mention_id, entity: "user", entity_id: user.id)
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.mention_id).to eq(mention_id)
      end

      it "links comment mentions to document path" do
        mention_id = unique_id("mention")
        ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: mention_content(mention_id, entity: "user", entity_id: user.id)
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_path).to include(document.id)
        expect(mentions.first.object_path).not_to include("versions")
      end
    end

    context "deduplication" do
      let(:document) { documents(:one) }

      it "deduplicates mentions by mention_id across versions" do
        mention_id = unique_id("mention")

        # Version 1 has the mention
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: 2.days.ago
        )
        # Version 2 has the same mention — reconciler updates existing record
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
      end
    end

    context "multiple documents" do
      it "extracts mentions from all provided documents" do
        doc1 = documents(:one)
        doc2 = documents(:two)

        id1 = unique_id("mention")
        id2 = unique_id("mention")

        doc1.versions.create!(
          content_blocks: mention_content(id1, entity: "user", entity_id: user.id),
          created_by: author
        )
        doc2.versions.create!(
          content_blocks: mention_content(id2, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([doc1, doc2], user)
        expect(mentions.length).to eq(2)
      end
    end

    context "edge cases" do
      let(:document) { documents(:one) }

      it "returns empty array for documents with no versions or comments" do
        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to eq([])
      end

      it "returns empty array for empty document array" do
        mentions = described_class.get_all_mentions([], user)
        expect(mentions).to eq([])
      end
    end

    it "returns Mention structs with EmojiExtractable" do
      document = documents(:one)
      mention_id = unique_id("mention")
      document.versions.create!(
        content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
        created_by: author
      )

      mentions = described_class.get_all_mentions([document], user)
      expect(mentions.first).to be_a(Mention)
      expect(mentions.first).to respond_to(:object_title_emoji)
      expect(mentions.first).to respond_to(:object_title_emojiless)
    end
  end

  context "with object_reference_extractors flag disabled (from_blocknote)" do
    before { Flipper.disable(:object_reference_extractors) }

    include_examples "get_all_mentions behavior"
  end

  context "with object_reference_extractors flag enabled (from_object_references)" do
    before { Flipper.enable(:object_reference_extractors) }

    include_examples "get_all_mentions behavior"
  end
end
