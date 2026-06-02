require "rails_helper"

RSpec.describe ImportSessionCompletionJob, type: :job do
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

  def create_import_file(relative_path:, status:)
    ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: :document,
      format: "markdown",
      status: status,
      checksum: SecureRandom.hex,
      file_size: 100
    )
  end

  describe "#perform" do
    it "marks session completed when all files succeeded" do
      create_import_file(relative_path: "a.md", status: :completed)
      create_import_file(relative_path: "b.md", status: :completed)
      create_import_file(relative_path: "c.md", status: :completed)

      described_class.perform_now(session)

      expect(session.reload).to be_completed
      expect(session.completed_processing_at).to be_present
    end

    it "marks session partial when some files failed" do
      create_import_file(relative_path: "a.md", status: :completed)
      create_import_file(relative_path: "b.md", status: :failed)
      create_import_file(relative_path: "c.md", status: :completed)

      described_class.perform_now(session)

      expect(session.reload).to be_partial
    end

    it "does not notify Sentry when all files processed cleanly" do
      create_import_file(relative_path: "a.md", status: :completed)

      expect(Sentry).not_to receive(:capture_message)

      described_class.perform_now(session)
    end

    context "when files are stuck in :processing (interrupted job, silent retry)" do
      it "marks stuck files as failed" do
        create_import_file(relative_path: "done.md", status: :completed)
        stuck1 = create_import_file(relative_path: "stuck1.md", status: :processing)
        stuck2 = create_import_file(relative_path: "stuck2.md", status: :processing)

        described_class.perform_now(session)

        expect(stuck1.reload).to be_failed
        expect(stuck2.reload).to be_failed
        expect(stuck1.error_message).to be_present
        expect(stuck2.error_message).to be_present
      end

      it "marks session as partial (not completed) when stuck files are present" do
        create_import_file(relative_path: "done.md", status: :completed)
        create_import_file(relative_path: "stuck.md", status: :processing)

        described_class.perform_now(session)

        expect(session.reload).to be_partial
      end

      it "reflects stuck files as failed in live failed_files count" do
        create_import_file(relative_path: "stuck1.md", status: :processing)
        create_import_file(relative_path: "stuck2.md", status: :processing)

        described_class.perform_now(session)

        expect(session.failed_files).to eq(2)
      end

      it "sends a Sentry warning with session context" do
        create_import_file(relative_path: "stuck.md", status: :processing)

        expect(Sentry).to receive(:capture_message).with(
          "Import session completed with stuck files",
          level: :warning,
          extra: hash_including(
            session_id: session.id,
            stuck_count: 1,
            total_files: session.total_files
          )
        )

        described_class.perform_now(session)
      end
    end
  end
end
