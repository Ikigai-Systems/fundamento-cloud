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
  end
end
