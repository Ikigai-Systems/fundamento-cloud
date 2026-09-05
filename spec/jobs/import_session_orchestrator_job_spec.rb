require "rails_helper"

RSpec.describe ImportSessionOrchestratorJob, type: :job do
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

  def add_file(relative_path:, file_type:, format: "markdown", status: :uploaded)
    ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: file_type,
      format: format,
      status: status,
      checksum: SecureRandom.hex,
      file_size: 1024
    )
  end

  describe "#perform" do
    it "enqueues ImportDocumentJob for each document file" do
      add_file(relative_path: "doc1.md", file_type: :document)
      add_file(relative_path: "doc2.md", file_type: :document)

      expect(ImportDocumentJob).to receive(:perform_later).twice
      allow(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    it "enqueues ImportAttachmentJob for each attachment file" do
      add_file(relative_path: "assets/img.png", file_type: :attachment, format: "image")

      expect(ImportAttachmentJob).to receive(:perform_later).once
      allow(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    it "skips non-uploaded files" do
      add_file(relative_path: "failed.md", file_type: :document, status: :failed)

      expect(ImportDocumentJob).not_to receive(:perform_later)
      allow(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    context "when there is nothing left to enqueue" do
      # GoodJob fires on_finish synchronously for an empty batch (it has no unfinished jobs
      # to wait for), which re-runs link resolution over an already-finished session — the
      # source of the duplicate versions. Every retry_failed with nothing to retry hit this.
      it "does not enqueue an empty batch" do
        add_file(relative_path: "failed.md", file_type: :document, status: :failed)

        expect(GoodJob::Batch).not_to receive(:enqueue)

        described_class.perform_now(session)
      end

      it "finishes the session when nothing is in flight" do
        add_file(relative_path: "failed.md", file_type: :document, status: :failed)
        allow(GoodJob::Batch).to receive(:enqueue).and_yield

        expect {
          described_class.perform_now(session)
        }.to have_enqueued_job(ImportSessionCompletionJob).with(session)
      end

      it "leaves in-flight files alone when the orchestrator is re-run" do
        # A re-performed orchestrator sees files as :processing, not :uploaded. Finishing
        # the session here would mark those healthy files as failed.
        add_file(relative_path: "inflight.md", file_type: :document, status: :processing)
        allow(GoodJob::Batch).to receive(:enqueue).and_yield

        expect {
          described_class.perform_now(session)
        }.not_to have_enqueued_job(ImportSessionCompletionJob)
      end
    end

    it "creates directory documents for intermediate paths before enqueuing file jobs" do
      add_file(relative_path: "Notes/Projects/foo.md", file_type: :document)

      expect(ImportDocumentJob).to receive(:perform_later).once
      allow(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)

      # Should have created "Notes" and "Notes/Projects" directory documents
      expect(session.reload.path_map.keys).to include("Notes", "Notes/Projects")

      # Directory documents should not be drafts (must have a version)
      session.path_map.each_value do |doc_id|
        doc = Document.find(doc_id)
        expect(doc).not_to be_draft
      end
    end
  end
end
