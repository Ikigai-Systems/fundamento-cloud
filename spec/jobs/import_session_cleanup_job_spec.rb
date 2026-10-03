require "rails_helper"

RSpec.describe ImportSessionCleanupJob, type: :job do
  fixtures :organizations, :users, :spaces, :organization_memberships, :documents

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  def session(**attributes)
    ImportSession.create!(
      organization: org, space: space, organization_membership: membership,
      expires_at: 1.day.from_now, **attributes
    )
  end

  def source_file(import_session, key:)
    file = ImportFile.create!(
      import_session: import_session, relative_path: "note.md",
      file_type: :document, status: :completed
    )
    file.file.attach(
      io: StringIO.new("source bytes"), filename: "note.md",
      content_type: "text/markdown", key: key
    )
    [file, file.file.blob]
  end

  it "destroys expired pending sessions" do
    expired = session(expires_at: 1.day.ago)
    active = session(expires_at: 1.day.from_now)

    described_class.perform_now

    expect(ImportSession.find_by(id: expired.id)).to be_nil
    expect(ImportSession.find_by(id: active.id)).to be_present
  end

  it "does not destroy completed sessions even if past expires_at" do
    completed = session(status: :completed, expires_at: 1.day.ago)

    described_class.perform_now

    expect(ImportSession.find_by(id: completed.id)).to be_present
  end

  # Until this, a finished import kept its uploaded sources forever. They are a staging area:
  # the documents and attachments it produced are records in their own right. What the sources
  # are still good for -- retrying a partial import, diagnosing a bad conversion -- has a shelf
  # life, so they go once the retention window is past.
  describe "a finished import past the retention window" do
    let(:stale) do
      session(status: :completed, completed_processing_at: (ImportSession::FINISHED_RETENTION + 1.day).ago)
    end

    it "is removed along with its files" do
      source_file(stale, key: "stale-source-key")

      expect { described_class.perform_now }
        .to change { ImportSession.exists?(stale.id) }.from(true).to(false)
        .and change { ImportFile.count }.by(-1)
    end

    it "is left alone inside the window" do
      recent = session(status: :completed, completed_processing_at: 1.day.ago)

      expect { described_class.perform_now }.not_to change { ImportSession.exists?(recent.id) }
    end

    # The hazard worth a test of its own: an import hands its blob to the Attachment it creates
    # instead of copying the bytes, so purging through dependent: :purge_later would delete the
    # file behind an imported document's attachment. Production has 2,648 blobs shared this way.
    it "keeps a blob the imported document still points at" do
      _file, blob = source_file(stale, key: "shared-source-key")

      attachment = Attachment.create!(
        organization: org, parent: documents(:one), filename: "note.md", mime_type: "text/markdown"
      )
      attachment.file.attach(blob)

      described_class.perform_now

      expect(ActiveStorage::Blob.exists?(blob.id)).to be(true)
      expect(attachment.reload.file).to be_attached
    end

    it "releases a blob nothing else points at" do
      _file, blob = source_file(stale, key: "lonely-source-key")

      expect { described_class.perform_now }
        .to have_enqueued_job(ActiveStorage::PurgeJob).with(blob)
    end
  end
end
