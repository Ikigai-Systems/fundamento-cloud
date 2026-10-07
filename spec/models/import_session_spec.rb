require "rails_helper"

RSpec.describe ImportSession, type: :model do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  describe "creation" do
    it "requires organization, space, and membership" do
      session = ImportSession.new
      expect(session.valid?).to be false
      expect(session.errors[:organization]).to include("must exist")
    end

    it "sets expires_at to 7 days from now by default" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session.expires_at).to be_within(1.minute).of(7.days.from_now)
    end

    it "defaults to pending status" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session).to be_pending
    end

    it "defaults source_format to generic" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session.source_format).to eq("generic")
    end
  end

  describe "live counter methods" do
    let(:session) do
      ImportSession.create!(organization: org, space: space, organization_membership: membership)
    end

    it "returns 0 when no files exist" do
      expect(session.total_files).to eq(0)
      expect(session.processed_files).to eq(0)
      expect(session.failed_files).to eq(0)
    end

    it "counts files by status" do
      ImportFile.create!(import_session: session, relative_path: "a.md", file_type: :document, format: "markdown", status: :completed, checksum: "c1", file_size: 1)
      ImportFile.create!(import_session: session, relative_path: "b.md", file_type: :document, format: "markdown", status: :completed, checksum: "c2", file_size: 1)
      ImportFile.create!(import_session: session, relative_path: "c.md", file_type: :document, format: "markdown", status: :failed, checksum: "c3", file_size: 1)

      expect(session.total_files).to eq(3)
      expect(session.processed_files).to eq(2)
      expect(session.failed_files).to eq(1)
    end

    it "uses preloaded counts when available" do
      counts = { [session.id, ImportFile.statuses[:completed]] => 5 }
      session.preload_status_counts(counts)

      expect(session.processed_files).to eq(5)
    end
  end

  describe "#merge_path_map!" do
    it "atomically adds an entry to path_map" do
      session = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership
      )
      session.merge_path_map!("Notes/foo.md", "doc_abc")
      expect(session.reload.path_map).to eq({ "Notes/foo.md" => "doc_abc" })
    end

    it "does not overwrite existing entries" do
      session = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership
      )
      session.merge_path_map!("a.md", "doc_1")
      session.merge_path_map!("b.md", "doc_2")
      expect(session.reload.path_map.keys).to contain_exactly("a.md", "b.md")
    end
  end

  describe ".expired" do
    it "returns pending/uploading sessions past expires_at" do
      expired = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership,
        expires_at: 1.day.ago
      )
      active = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership,
        expires_at: 1.day.from_now
      )
      expect(ImportSession.expired).to include(expired)
      expect(ImportSession.expired).not_to include(active)
    end
  end

  # An import hands its blob to the Attachment it creates rather than copying the bytes
  # (ImportDocumentJob#attach_source_file), so the import file and the imported document's
  # attachment share one blob. Destroying the session must not take the document's file with it.
  describe "destroying a finished import" do
    include ActiveJob::TestHelper

    fixtures :documents

    let(:session) { ImportSession.create!(organization: org, space: space, organization_membership: membership, status: :completed) }

    let!(:attachment) do
      import_file = ImportFile.create!(
        import_session: session, document: documents(:one), relative_path: "note.docx",
        file_type: :document, status: :completed
      )
      import_file.file.attach(
        io: StringIO.new("source bytes"), filename: "note.docx",
        content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )

      Attachment.create!(
        organization: org, parent: documents(:one), filename: "note.docx",
        mime_type: import_file.file.blob.content_type
      ).tap { |a| a.file.attach(import_file.file.blob) }
    end

    def expect_attachment_intact
      expect(ActiveStorage::Blob.exists?(attachment.file.blob.id)).to be(true)
      expect(attachment.reload.file.download).to eq("source bytes")
    end

    it "keeps the imported document's attachment when the session is destroyed" do
      perform_enqueued_jobs { session.destroy! }

      expect(ImportFile.where(import_session_id: session.id)).to be_empty
      expect_attachment_intact
    end

    # The control for the test above: without it, that one would also pass if the purge job
    # never ran. Active Storage's Blob refuses to be destroyed while any attachment still names
    # it, so a shared blob survives the purge and only an exclusive one goes.
    it "still purges a source file nothing else uses" do
      lonely = ImportFile.create!(
        import_session: session, relative_path: "other.md", file_type: :document, status: :completed
      )
      lonely.file.attach(io: StringIO.new("only here"), filename: "other.md", content_type: "text/markdown")
      lonely_blob = lonely.file.blob

      perform_enqueued_jobs { session.destroy! }

      expect(ActiveStorage::Blob.exists?(lonely_blob.id)).to be(false)
      expect_attachment_intact
    end
  end
end
