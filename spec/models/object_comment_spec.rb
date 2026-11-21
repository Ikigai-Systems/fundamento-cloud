require "rails_helper"

RSpec.describe ObjectComment, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments

  let(:document) { documents(:one) }
  let(:content) { [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "A comment"}]}] }

  def build_comment(**attributes)
    ObjectComment.new(
      organization: organizations(:is),
      organization_membership: organization_memberships(:om_is_pawel),
      object: document,
      content: content,
      **attributes
    )
  end

  describe "a comment on a block" do
    it "is a comment on the document when it names no block" do
      expect(build_comment).to be_valid
      expect(build_comment).not_to be_anchored
    end

    it "remembers the block, what was quoted and the text around it" do
      comment = build_comment(
        anchor_block_id: "block-1",
        anchor_quote: "quoted",
        anchor_prefix: "before ",
        anchor_suffix: " after",
        anchor_text: "before quoted after"
      )

      expect(comment).to be_valid
      expect(comment).to be_anchored
    end

    it "treats a blank block id, as a form sends it, as none" do
      comment = build_comment(anchor_block_id: "")
      comment.valid?

      expect(comment.anchor_block_id).to be_nil
      expect(comment).not_to be_anchored
    end

    it "cuts what it remembers to a size that cannot grow with the document" do
      comment = build_comment(anchor_block_id: "block-1", anchor_text: "x" * (ObjectComment::ANCHOR_TEXT_LIMIT + 500))
      comment.valid?

      expect(comment.anchor_text.length).to eq(ObjectComment::ANCHOR_TEXT_LIMIT)
    end

    it "cannot quote a block without naming it" do
      comment = build_comment(anchor_quote: "quoted")

      expect(comment).not_to be_valid
      expect(comment.errors[:anchor_block_id]).to be_present
    end

    it "is only for a document: a table has no blocks" do
      table = Table.new(id: "tbl")
      comment = build_comment(object: table, anchor_block_id: "block-1")

      expect(comment).not_to be_valid
      expect(comment.errors[:anchor_block_id]).to be_present
    end
  end

  describe "scopes" do
    before do
      build_comment(anchor_block_id: "block-1").save!
      build_comment(anchor_block_id: "block-2").save!
    end

    it "tells the comments on a block from the comments on the document" do
      expect(document.comments.on_block("block-1").count).to eq(1)
      expect(document.comments.unanchored).to contain_exactly(object_comments(:one))
    end
  end

  describe "reloading what shows it" do
    include ActionCable::TestHelper

    # The frames a Turbo stream was told to reload, from what was broadcast for the document.
    def reloaded_frames
      stream = Turbo::StreamsChannel.send(:stream_name_from, [:object_comments, document])

      ActionCable.server.pubsub.broadcasts(stream).map { |message| JSON.parse(message)[/target="([^"]+)"/, 1] }
    end

    it "reloads the document's list for a comment on the document" do
      build_comment.save!

      expect(reloaded_frames).to eq(["#object_comments"])
    end

    it "reloads the block's frame, not the document's list, for a comment on a block" do
      build_comment(anchor_block_id: "block-1").save!

      expect(reloaded_frames).to include("#object_comments_block_block-1")
      expect(reloaded_frames).not_to include("#object_comments")
    end

    it "reloads the list of comments on removed blocks, which a comment on a block may be in" do
      build_comment(anchor_block_id: "block-1").save!

      expect(reloaded_frames).to include("#object_comments_orphaned")
    end

    it "reloads the document's list and that of removed blocks when a comment leaves its block" do
      comment = build_comment(anchor_block_id: "block-1", anchor_text: "What the block said")
      comment.save!
      ActionCable.server.pubsub.clear

      comment.detach_from_block!

      expect(reloaded_frames).to contain_exactly("#object_comments", "#object_comments_orphaned")
      expect(comment.reload).to have_attributes(anchor_block_id: nil, anchor_text: nil)
    end
  end
end
