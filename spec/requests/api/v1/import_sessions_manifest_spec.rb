require "rails_helper"

RSpec.describe "Api::V1::ImportSessions#manifest", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents

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
    describe "files whose bytes are already stored" do
      let(:bytes) { "the same photo" }
      let(:checksum) { OpenSSL::Digest::MD5.base64digest(bytes) }

      # Stored the way the editor stores a dropped file: an Attachment with its own blob.
      def stored_attachment(parent:, organization: org, filename: "earlier.png")
        attachment = Attachment.create!(organization: organization, parent: parent, filename: filename, mime_type: "image/png")
        attachment.file.attach(io: StringIO.new(bytes), filename: filename, content_type: "image/png")
        attachment
      end

      def submit(files, as: auth_headers, to: session)
        post manifest_api_v1_import_session_path(to), params: { files: files }, headers: as
        JSON.parse(response.body).index_by { |f| f["relative_path"] }
      end

      def image_entry(path = "assets/image.png", checksum: self.checksum, size: bytes.bytesize)
        { relative_path: path, checksum: checksum, file_size: size }
      end

      it "reuses them instead of asking for an upload" do
        earlier = stored_attachment(parent: space)

        entry = submit([image_entry])["assets/image.png"]

        expect(entry["direct_upload_url"]).to be_nil
        expect(entry["status"]).to eq("uploaded")
        expect(entry["skipped_reason"]).to eq("already_uploaded")
        reused = session.import_files.find_by!(relative_path: "assets/image.png")
        expect(reused.file.blob).to eq(earlier.file.blob)
      end

      it "matches by content, whatever the file is called and wherever it was stored" do
        stored_attachment(parent: documents(:one), filename: "IMG_0042.png")

        entry = submit([image_entry("Pliki/c8790093_renamed.png")])["Pliki/c8790093_renamed.png"]

        expect(entry["skipped_reason"]).to eq("already_uploaded")
      end

      # The reported bug: a skipped attachment never reached this session's path_map, so a
      # document imported alongside it kept its raw ![](assets/image.png) link.
      it "binds the reused file to this import's documents" do
        earlier = stored_attachment(parent: space)
        submit([image_entry])
        session.update!(status: :processing)

        ImportAttachmentJob.perform_now(session.import_files.find_by!(relative_path: "assets/image.png"))

        attachment = Attachment.order(:created_at).last
        expect(attachment).not_to eq(earlier)
        expect(attachment.file.blob).to eq(earlier.file.blob)
        expect(session.reload.path_map["assets/image.png"]).to eq("attachment:#{attachment.id}.png")
      end

      it "asks for an upload when only the checksum matches, not the size" do
        stored_attachment(parent: space)

        expect(submit([image_entry(size: bytes.bytesize + 1)])["assets/image.png"]["direct_upload_url"]).to be_present
      end

      it "asks for an upload when the stored copy is on a trashed document" do
        stored_attachment(parent: documents(:one))
        documents(:one).update_column(:deleted_at, Time.current)

        expect(submit([image_entry])["assets/image.png"]["direct_upload_url"]).to be_present
      end

      it "still skips an unchanged document imported before" do
        earlier_session = ImportSession.create!(organization: org, space: space, organization_membership: membership, status: :completed)
        ImportFile.create!(import_session: earlier_session, relative_path: "Notes/hello.md", checksum: "abc123",
          file_size: 1024, file_type: :document, format: "markdown", status: :completed)

        entry = submit(manifest_files)["Notes/hello.md"]

        expect(entry["status"]).to eq("skipped")
        expect(entry["skipped_reason"]).to eq("already_imported")
      end

      # The client only claims to have the bytes. Reusing a blob from a space the importer
      # cannot open would hand over that file to anyone who learned its checksum.
      context "when the only stored copy is in a space the importer cannot read" do
        let(:hc) { organizations(:hc) }
        let(:maria) { organization_memberships(:om_hc_maria) }
        let(:maria_headers) do
          token = ApiToken.create!(organization: hc, organization_membership: maria, title: "Maria")
          { "Authorization" => "Bearer #{token.encrypted_token}" }
        end
        let(:marias_session) { ImportSession.create!(organization: hc, space: spaces(:hc_default), organization_membership: maria) }

        it "asks for an upload and never attaches that blob" do
          private_copy = stored_attachment(parent: spaces(:hc_pawels), organization: hc)

          entry = submit([image_entry], as: maria_headers, to: marias_session)["assets/image.png"]

          expect(entry["direct_upload_url"]).to be_present
          expect(entry["skipped_reason"]).to be_nil
          expect(marias_session.import_files.find_by!(relative_path: "assets/image.png").file.attached?).to be(false)
          expect(private_copy.file.blob.attachments.count).to eq(1)
        end

        it "reuses a copy that is also in a space the importer can read" do
          stored_attachment(parent: spaces(:hc_pawels), organization: hc)
          stored_attachment(parent: spaces(:hc_default), organization: hc)

          entry = submit([image_entry], as: maria_headers, to: marias_session)["assets/image.png"]

          expect(entry["skipped_reason"]).to eq("already_uploaded")
        end
      end

      it "never reuses a blob from another organization" do
        stored_attachment(parent: spaces(:hc_default), organization: organizations(:hc))

        expect(submit([image_entry])["assets/image.png"]["direct_upload_url"]).to be_present
      end
    end
  end
end
