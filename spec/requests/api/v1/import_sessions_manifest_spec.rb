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
    describe "files completed in an earlier session of the same space" do
      let(:earlier_session) do
        ImportSession.create!(
          organization: org, space: space,
          organization_membership: membership,
          status: :completed
        )
      end

      def completed_earlier(relative_path:, checksum:, file_type:, format:, attach: true)
        import_file = ImportFile.create!(
          import_session: earlier_session,
          relative_path: relative_path, checksum: checksum, file_size: 1024,
          file_type: file_type, format: format, status: :completed
        )
        if attach
          import_file.file.attach(
            io: StringIO.new("bytes"), filename: File.basename(relative_path), content_type: "image/png"
          )
        end
        import_file
      end

      def submit_manifest
        post manifest_api_v1_import_session_path(session),
          params: { files: manifest_files },
          headers: auth_headers
        JSON.parse(response.body).index_by { |f| f["relative_path"] }
      end

      it "reuses an attachment's stored bytes instead of skipping it" do
        earlier = completed_earlier(relative_path: "assets/image.png", checksum: "def456",
          file_type: :attachment, format: "image")

        entry = submit_manifest["assets/image.png"]

        expect(entry["direct_upload_url"]).to be_nil
        expect(entry["status"]).to eq("uploaded")
        expect(entry["skipped_reason"]).to eq("already_uploaded")

        reused = session.import_files.find_by!(relative_path: "assets/image.png")
        expect(reused.file.blob).to eq(earlier.file.blob)
      end

      # The reported bug: a skipped attachment never reached this session's path_map, so a
      # document imported alongside it kept its raw ![](assets/image.png) link.
      it "binds the reused attachment to this session's documents" do
        earlier = completed_earlier(relative_path: "assets/image.png", checksum: "def456",
          file_type: :attachment, format: "image")
        submit_manifest
        session.update!(status: :processing)

        reused = session.import_files.find_by!(relative_path: "assets/image.png")
        ImportAttachmentJob.perform_now(reused)

        attachment = Attachment.last
        expect(attachment.file.blob).to eq(earlier.file.blob)
        expect(session.reload.path_map["assets/image.png"]).to eq("attachment:#{attachment.id}.png")
      end

      it "uploads afresh when the attachment's checksum changed" do
        completed_earlier(relative_path: "assets/image.png", checksum: "changed",
          file_type: :attachment, format: "image")

        expect(submit_manifest["assets/image.png"]["direct_upload_url"]).to be_present
      end

      it "uploads afresh when the earlier file no longer has its bytes" do
        completed_earlier(relative_path: "assets/image.png", checksum: "def456",
          file_type: :attachment, format: "image", attach: false)

        expect(submit_manifest["assets/image.png"]["direct_upload_url"]).to be_present
      end

      it "still skips an unchanged document" do
        completed_earlier(relative_path: "Notes/hello.md", checksum: "abc123",
          file_type: :document, format: "markdown", attach: false)

        entry = submit_manifest["Notes/hello.md"]

        expect(entry["status"]).to eq("skipped")
        expect(entry["skipped_reason"]).to eq("already_imported")
        expect(entry["direct_upload_url"]).to be_nil
      end
    end
  end
end
