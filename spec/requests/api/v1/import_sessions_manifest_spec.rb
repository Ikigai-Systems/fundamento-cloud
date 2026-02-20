require "rails_helper"

RSpec.describe "Api::V1::ImportSessions#manifest", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  let!(:api_token) do
    ApiToken.create!(
      organization: org,
      organization_membership: membership,
      title: "Test token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership
    )
  end

  let(:manifest_files) do
    [
      { relative_path: "Notes/hello.md", checksum: "abc123", file_size: 1024,
        format: "markdown", file_type: "document" },
      { relative_path: "assets/image.png", checksum: "def456", file_size: 204800,
        format: "image", file_type: "attachment" }
    ]
  end

  before do
    # Disk storage in test environment needs a host for URL generation
    allow_any_instance_of(ActiveStorage::Blob).to receive(:service_url_for_direct_upload)
      .and_return("https://storage.example.com/upload/test-key")
  end

  describe "POST /api/v1/import_sessions/:id/manifest" do
    it "creates ImportFile records and returns upload URLs for all files" do
      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
      expect(json.first).to have_key("id")
      expect(json.first).to have_key("direct_upload_url")
      expect(session.import_files.count).to eq(2)
      expect(session.reload.total_files).to eq(2)
    end

    it "skips already-uploaded files with matching checksum" do
      # Pre-create an uploaded file
      existing = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/hello.md",
        checksum: "abc123",
        file_size: 1024,
        format: "markdown",
        file_type: :document,
        status: :uploaded
      )

      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      json = JSON.parse(response.body)
      already_uploaded = json.find { |f| f["relative_path"] == "Notes/hello.md" }
      expect(already_uploaded["status"]).to eq("uploaded")
      expect(already_uploaded["direct_upload_url"]).to be_nil
    end

    it "re-issues upload URL when checksum changed" do
      existing = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/hello.md",
        checksum: "old_checksum",
        file_size: 1024,
        format: "markdown",
        file_type: :document,
        status: :uploaded
      )

      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      json = JSON.parse(response.body)
      changed = json.find { |f| f["relative_path"] == "Notes/hello.md" }
      expect(changed["direct_upload_url"]).to be_present
    end
  end
end
