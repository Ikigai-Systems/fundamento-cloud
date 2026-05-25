require "rails_helper"

RSpec.describe ImportAttachmentJob, type: :job do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing
    )
  end

  def build_attachment_file(relative_path:, format: "image")
    import_file = ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: :attachment,
      format: format,
      status: :uploaded,
      checksum: SecureRandom.hex,
      file_size: 1024
    )
    import_file.file.attach(
      io: StringIO.new("fake image data"),
      filename: File.basename(relative_path),
      content_type: "image/png"
    )
    import_file
  end

  describe "#perform" do
    it "creates an Attachment record pointing to the blob" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")

      expect {
        described_class.perform_now(import_file)
      }.to change(Attachment, :count).by(1)

      import_file.reload
      expect(import_file).to be_completed
    end

    it "writes relative_path → attachment_id to session path_map" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")
      described_class.perform_now(import_file)

      attachment = Attachment.last
      expect(session.reload.path_map["assets/photo.png"]).to eq("attachment:#{attachment.id}")
    end

    it "increments session processed_files counter" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.processed_files }.by(1)
    end

    it "attaches to the folder document when path_map has the parent directory" do
      folder_doc = space.documents.create!(organization: org, title: "assets")
      session.merge_path_map!("assets", folder_doc.id)
      session.reload

      import_file = build_attachment_file(relative_path: "assets/photo.png")
      described_class.perform_now(import_file)

      attachment = Attachment.last
      expect(attachment.parent).to eq(folder_doc)
    end

    it "walks up directory tree to find closest folder document" do
      folder_doc = space.documents.create!(organization: org, title: "Notes")
      session.merge_path_map!("Notes", folder_doc.id)
      session.reload

      import_file = build_attachment_file(relative_path: "Notes/assets/photo.png")
      described_class.perform_now(import_file)

      attachment = Attachment.last
      expect(attachment.parent).to eq(folder_doc)
    end

    it "falls back to space home document when no folder document exists" do
      home_doc = space.documents.create!(organization: org, title: "Home")
      space.update!(home_document: home_doc)

      import_file = build_attachment_file(relative_path: "photo.png")
      described_class.perform_now(import_file)

      attachment = Attachment.last
      expect(attachment.parent).to eq(home_doc)
    end

    context "when the file is stuck in :processing (interrupted job retry)" do
      it "processes the file instead of returning early" do
        import_file = build_attachment_file(relative_path: "assets/photo.png")
        import_file.update_column(:status, ImportFile.statuses[:processing])

        expect {
          described_class.perform_now(import_file)
        }.to change(Attachment, :count).by(1)

        expect(import_file.reload).to be_completed
      end

      it "does not create a duplicate attachment if already completed" do
        import_file = build_attachment_file(relative_path: "assets/photo.png")
        import_file.update_column(:status, ImportFile.statuses[:completed])

        expect {
          described_class.perform_now(import_file)
        }.not_to change(Attachment, :count)
      end
    end
  end
end
