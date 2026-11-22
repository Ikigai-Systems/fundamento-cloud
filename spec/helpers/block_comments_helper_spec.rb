require "rails_helper"

RSpec.describe BlockCommentsHelper, type: :helper do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:document) { documents(:one) }
  let(:can_create) { true }

  before do
    # The view's `policy` comes from Pundit, which a helper spec does not load.
    policy = double(create?: can_create)
    helper.define_singleton_method(:policy) { |_record| policy }
  end

  def comment_on(block_id, **anchor)
    document.comments.create!(
      organization: organizations(:is),
      organization_membership: organization_memberships(:om_is_pawel),
      content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "A comment"}]}],
      anchor_block_id: block_id,
      **anchor
    )
  end

  describe "#block_comments_props" do
    it "names the document and each commented block once" do
      comment_on("block-1")
      comment_on("block-1")
      comment_on("block-2")

      props = helper.block_comments_props(document)

      expect(props[:objectGid]).to eq(document.to_gid_param)
      expect(props[:blockIds]).to contain_exactly("block-1", "block-2")
    end

    it "has what the comments quote, to mark it in the blocks" do
      comment_on("block-1", anchor_quote: "some words", anchor_prefix: "say ", anchor_suffix: " here")
      comment_on("block-2")

      expect(helper.block_comments_props(document)[:quotes])
        .to eq([{blockId: "block-1", quote: "some words", prefix: "say ", suffix: " here"}])
    end

    it "says the user can comment" do
      expect(helper.block_comments_props(document)[:canComment]).to be(true)
    end

    context "when the user may not comment" do
      let(:can_create) { false }

      it "says so" do
        expect(helper.block_comments_props(document)[:canComment]).to be(false)
      end
    end

    context "for a version" do
      fixtures :versions

      let(:document) { documents(:two) }
      let(:version) { document.versions.first }

      it "has the commented blocks that version has, and takes no new comments" do
        comment_on("initialBlockId", anchor_quote: "kept")
        comment_on("a-block-the-version-never-had", anchor_quote: "never there")

        props = helper.block_comments_props(document, version: version)

        expect(props[:blockIds]).to eq(["initialBlockId"])
        expect(props[:quotes].map { |quote| quote[:quote] }).to eq(["kept"])
        expect(props[:canComment]).to be(false)
      end
    end

    it "has no quotes when only the document has comments" do
      expect(helper.block_comments_props(document)[:quotes]).to eq([])
    end

    it "has no blocks when only the document has comments" do
      expect(helper.block_comments_props(document)[:blockIds]).to eq([])
    end
  end
end
