require "rails_helper"

RSpec.describe CommentsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments

  let(:author) { users(:pawel) }
  let(:other_user) { users(:stefan) }
  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }
  let(:comment) { object_comments(:one) }

  let(:turbo_headers) { { "Turbo-Frame" => "object_comments" } }

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
