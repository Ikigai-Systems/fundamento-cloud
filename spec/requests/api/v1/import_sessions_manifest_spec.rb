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
    it "classifies files itself and ignores what the client claims" do
      # fundamento-cli still labels .doc a document, which can only ever fail. Whatever the
      # client asserts, the server decides from the path.
      post manifest_api_v1_import_session_path(session),
        params: { files: [
          { relative_path: "Osobiste/Outline.doc", checksum: "d1", file_size: 10,
            format: "doc", file_type: "document" },
          { relative_path: "Notes/real.md", checksum: "d2", file_size: 10,
            format: "image", file_type: "attachment" }
        ] },
        headers: auth_headers

      expect(response).to have_http_status(:ok)

      doc_file = session.import_files.find_by(relative_path: "Osobiste/Outline.doc")
      expect(doc_file).to be_attachment
      expect(doc_file.format).to eq("other")

      markdown_file = session.import_files.find_by(relative_path: "Notes/real.md")
      expect(markdown_file).to be_document
      expect(markdown_file.format).to eq("markdown")
    end

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

    describe "files imported by an earlier session" do
      let(:earlier_session) do
        ImportSession.create!(
          organization: org, space: space,
          organization_membership: membership, status: :completed
        )
      end

      def complete_in_earlier_session(relative_path, checksum, object_id)
        earlier_session.import_files.create!(
          relative_path: relative_path, checksum: checksum, file_size: 1,
          format: "markdown", file_type: :document, status: :completed
        )
        earlier_session.merge_path_map!(relative_path, object_id)
      end

      def manifest_entry_for(path)
        post manifest_api_v1_import_session_path(session),
          params: { files: manifest_files },
          headers: auth_headers
        JSON.parse(response.body).find { |f| f["relative_path"] == path }
      end

      let(:imported_document) { space.documents.create!(organization: org, title: "hello") }

      it "skips a file whose imported document still exists" do
        complete_in_earlier_session("Notes/hello.md", "abc123", imported_document.id)

        entry = manifest_entry_for("Notes/hello.md")

        expect(entry["status"]).to eq("skipped")
        expect(entry["skipped_reason"]).to eq("already_imported")
      end

      it "imports a file again once its imported document was destroyed" do
        complete_in_earlier_session("Notes/hello.md", "abc123", imported_document.id)
        imported_document.destroy!

        entry = manifest_entry_for("Notes/hello.md")

        expect(entry["status"]).to eq("pending")
        expect(entry["direct_upload_url"]).to be_present
      end

      it "imports a file again while its imported document is in the trash" do
        complete_in_earlier_session("Notes/hello.md", "abc123", imported_document.id)
        imported_document.trash!

        entry = manifest_entry_for("Notes/hello.md")

        expect(entry["direct_upload_url"]).to be_present
      end

      it "imports an attachment again once the imported attachment was deleted" do
        attachment = Attachment.create!(organization: org, parent: space, filename: "image.png", mime_type: "image/png")
        complete_in_earlier_session("assets/image.png", "def456", "attachment:#{attachment.id}.png")
        kept = manifest_entry_for("assets/image.png")
        expect(kept["skipped_reason"]).to eq("already_imported")

        attachment.destroy!
        session.import_files.destroy_all

        entry = manifest_entry_for("assets/image.png")

        expect(entry["direct_upload_url"]).to be_present
      end
    end
  end
end
