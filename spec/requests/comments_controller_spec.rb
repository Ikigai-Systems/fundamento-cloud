require "rails_helper"

RSpec.describe CommentsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments, "tables/tables"

  let(:author) { users(:pawel) }
  let(:other_user) { users(:stefan) }
  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }
  let(:comment) { object_comments(:one) }

  let(:turbo_headers) { { "Turbo-Frame" => "object_comments" } }

  describe "comments on a block" do
    let(:content) { [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Remark on the block" }] }] }

    before do
      sign_in author
      post select_organization_path(organization)
    end

    def comment_on_block(block_id, text, object: document)
      ObjectComment.create!(
        organization: organization,
        organization_membership: organization_memberships(:om_is_pawel),
        object: object,
        content: [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => text }] }],
        anchor_block_id: block_id
      )
    end

    describe "GET #index" do
      before do
        comment_on_block("block-1", "Remark on block one")
        comment_on_block("block-2", "Remark on block two")
      end

      it "lists the comments of the document without those on its blocks" do
        get comments_path(object_gid: document.to_gid_param), headers: turbo_headers

        expect(response.body).to include("Test comment")
        expect(response.body).not_to include("Remark on block")
      end

      it "lists the comments on one block, and only those" do
        get comments_path(object_gid: document.to_gid_param, block_id: "block-1"),
          headers: { "Turbo-Frame" => "object_comments_block_block-1" }

        expect(response.body).to include("Remark on block one")
        expect(response.body).not_to include("Remark on block two")
        expect(response.body).not_to include("Test comment")
      end

      it "answers in the block's frame, which is where it is shown" do
        get comments_path(object_gid: document.to_gid_param, block_id: "block-1"),
          headers: { "Turbo-Frame" => "object_comments_block_block-1" }

        expect(response.body).to include('id="object_comments_block_block-1"')
      end
    end

    describe "the form for a comment on a block" do
      it "has a frame of its own in the block's comments, so a block can be commented before it has any" do
        get comments_path(object_gid: document.to_gid_param, block_id: "block-9"),
          headers: { "Turbo-Frame" => "object_comments_block_block-9" }

        expect(response.body).to include('id="new_object_comment_block_block-9"')
      end

      it "opens in the block's frame, not the document's" do
        get new_comment_path(object_gid: document.to_gid_param, anchor_block_id: "block-1"),
          headers: { "Turbo-Frame" => "new_object_comment_block_block-1" }

        expect(response.body).to include('id="new_object_comment_block_block-1"')
        expect(response.body).not_to include('id="new_object_comment"')
      end

      it "closes in the block's frame once the comment is saved" do
        post comments_path(object_gid: document.to_gid_param),
          params: { comment: { content: content.to_json, anchor_block_id: "block-1" } },
          headers: turbo_headers

        expect(response.body).to include('target="new_object_comment_block_block-1"')
      end
    end

    describe "read only" do
      it "has no form in a block's frame, as on an old version" do
        comment_on_block("block-1", "Remark on block one")

        get comments_path(object_gid: document.to_gid_param, block_id: "block-1", read_only: 1),
          headers: { "Turbo-Frame" => "object_comments_block_block-1" }

        expect(response.body).to include("Remark on block one")
        expect(response.body).not_to include("new_object_comment_block_block-1")
      end
    end

    describe "comments on blocks that are gone" do
      fixtures :versions

      let(:document) { documents(:two) }
      let(:removed_block_id) { "db948229-12cb-4357-92dc-94494df434ef" }
      let(:orphan_headers) { { "Turbo-Frame" => "object_comments_orphaned" } }

      before do
        document.versions.create!(
          created_by: author,
          content_blocks: document.current_blocks.reject { |block| block["id"] == removed_block_id }
        )
      end

      def orphan
        @orphan ||= comment_on_block(removed_block_id, "Remark on the removed block").tap do |comment|
          comment.update!(anchor_text: "This document will be edited via public link.")
        end
      end

      it "lists them with what the block said and the version that still had it" do
        orphan
        comment_on_block("initialBlockId", "Remark on a block that is still there")

        get comments_path(object_gid: document.to_gid_param, orphaned: 1), headers: orphan_headers

        expect(response.body).to include("Remark on the removed block")
        expect(response.body).to include("This document will be edited via public link.")
        expect(response.body).to include("See the block in version 1")
        expect(response.body).to include(removed_block_id)
        expect(response.body).not_to include("Remark on a block that is still there")
      end

      it "makes a comment a comment on the document when its author keeps it there" do
        post detach_comment_path(orphan, object_gid: document.to_gid_param), headers: orphan_headers

        expect(response).to have_http_status(:no_content)
        expect(orphan.reload).not_to be_anchored
        expect(orphan).to have_attributes(anchor_text: nil, anchor_quote: nil)
      end

      it "leaves it to its author to keep a comment" do
        sign_out author
        sign_in other_user
        post select_organization_path(organization)

        post detach_comment_path(orphan, object_gid: document.to_gid_param), headers: orphan_headers

        expect(response).to have_http_status(:forbidden)
        expect(orphan.reload).to be_anchored
      end
    end

    describe "GET #new" do
      it "carries the block into the form that saves the comment" do
        get new_comment_path(object_gid: document.to_gid_param, anchor_block_id: "block-1", anchor_quote: "some text"),
          headers: turbo_headers

        expect(response.body).to include('name="comment[anchor_block_id]"')
        expect(response.body).to include('value="block-1"')
        expect(response.body).to include('value="some text"')
      end

      it "has no anchor in the form for a comment on the document" do
        get new_comment_path(object_gid: document.to_gid_param), headers: turbo_headers

        expect(response.body).not_to include("anchor_block_id")
      end
    end

    describe "POST #create" do
      it "saves the block, the quote and the text around it with the comment" do
        expect {
          post comments_path(object_gid: document.to_gid_param),
            params: { comment: { content: content.to_json, anchor_block_id: "block-1", anchor_quote: "some text",
                                 anchor_prefix: "before ", anchor_suffix: " after", anchor_text: "before some text after" } },
            headers: turbo_headers
        }.to change { document.comments.on_block("block-1").count }.by(1)

        expect(response).to have_http_status(:ok)
        saved = document.comments.on_block("block-1").last
        expect(saved).to have_attributes(anchor_quote: "some text", anchor_prefix: "before ", anchor_suffix: " after",
                                         anchor_text: "before some text after")
      end

      it "is a comment on the document when it names no block" do
        post comments_path(object_gid: document.to_gid_param),
          params: { comment: { content: content.to_json } },
          headers: turbo_headers

        expect(document.comments.order(:created_at).last).not_to be_anchored
      end

      it "refuses a block on anything but a document" do
        table = tables_tables(:projects)

        expect {
          post comments_path(object_gid: table.to_gid_param),
            params: { comment: { content: content.to_json, anchor_block_id: "block-1" } },
            headers: turbo_headers
        }.not_to change(ObjectComment, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "PATCH #update" do
    let(:new_content) { [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Updated" }] }] }

    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "updates the comment content" do
        patch comment_path(comment, object_gid: document.to_gid_param),
          params: { comment: { content: new_content.to_json } },
          headers: turbo_headers

        expect(response).to have_http_status(:ok)
        expect(comment.reload.content).to eq(new_content)
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        patch comment_path(comment, object_gid: document.to_gid_param),
          params: { comment: { content: [].to_json } },
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE #destroy" do
    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "soft-deletes the comment by setting removed_at" do
        delete comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:no_content)
        expect(comment.reload.removed_at).to be_present
        expect(comment.reload).to be_persisted
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        delete comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST #restore" do
    before do
      comment.update_column(:removed_at, Time.current)
    end

    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "restores the comment by clearing removed_at" do
        post restore_comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:no_content)
        expect(comment.reload.removed_at).to be_nil
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        post restore_comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
