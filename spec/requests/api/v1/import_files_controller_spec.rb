require "rails_helper"

RSpec.describe "Api::V1::ImportFiles", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :import_sessions, :import_files

  let(:org) { organizations(:is) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) { import_sessions(:is_session_uploading) }
  let(:pending_file) { import_files(:is_file_pending) }

  let!(:api_token) do
    ApiToken.create!(organization: org, organization_membership: membership, title: "Test token")
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  describe "PATCH /api/v1/import_sessions/:session_id/import_files/:id" do
    it "marks file as uploaded and sets uploaded_at" do
      patch api_v1_import_session_import_file_path(session, pending_file),
        params: { status: "uploaded" },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      pending_file.reload
      expect(pending_file).to be_uploaded
      expect(pending_file.uploaded_at).to be_present
    end

    it "reflects the upload in the session's live uploaded_files count" do
      expect {
        patch api_v1_import_session_import_file_path(session, pending_file),
          params: { status: "uploaded" },
          headers: auth_headers
      }.to change { session.uploaded_files }.by(1)
    end
  end
end
