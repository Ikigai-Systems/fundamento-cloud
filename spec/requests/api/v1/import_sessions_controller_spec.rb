require "rails_helper"

RSpec.describe "Api::V1::ImportSessions", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :import_sessions

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }
  let(:completed_session) { import_sessions(:hc_session_completed) }

  let!(:api_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  describe "POST /api/v1/import_sessions" do
    it "creates a session and returns id and expires_at" do
      post api_v1_import_sessions_path,
        params: { space_id: is_default_space.id, source_format: "obsidian" },
        headers: auth_headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json).to have_key("id")
      expect(json).to have_key("expires_at")
      expect(json["status"]).to eq("pending")
    end

    it "returns unauthorized without a valid token" do
      post api_v1_import_sessions_path,
        params: { space_id: is_default_space.id }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/import_sessions/:id" do
    it "returns session status and counters" do
      session = ImportSession.create!(
        organization: ikigai_systems,
        space: is_default_space,
        organization_membership: pawel_ikigai_systems
      )

      get api_v1_import_session_path(session), headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["id"]).to eq(session.id)
      expect(json).to have_key("total_files")
      expect(json).to have_key("uploaded_files")
      expect(json).to have_key("processed_files")
    end
  end

  describe "DELETE /api/v1/import_sessions/:id" do
    it "destroys the session" do
      session = ImportSession.create!(
        organization: ikigai_systems,
        space: is_default_space,
        organization_membership: pawel_ikigai_systems
      )

      delete api_v1_import_session_path(session), headers: auth_headers

      expect(response).to have_http_status(:no_content)
      expect(ImportSession.find_by(id: session.id)).to be_nil
    end
  end
end
