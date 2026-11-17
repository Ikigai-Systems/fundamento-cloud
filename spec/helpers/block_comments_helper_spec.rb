require "rails_helper"

RSpec.describe BlockCommentsHelper, type: :helper do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:document) { documents(:one) }

  def comment_on(block_id)
    document.comments.create!(
      organization: organizations(:is),
      organization_membership: organization_memberships(:om_is_pawel),
      content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "A comment"}]}],
      anchor_block_id: block_id
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

    it "has no blocks when only the document has comments" do
      expect(helper.block_comments_props(document)[:blockIds]).to eq([])
    end
  end
end
