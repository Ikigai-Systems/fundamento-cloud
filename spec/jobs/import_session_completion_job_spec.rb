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

    describe "sibling order" do
      def import(relative_path, document_id, parent_id: nil)
        create_import_file(relative_path: relative_path, status: :completed)
        space.insert_hierarchy_node!(document_id, parent_id: parent_id)
        session.merge_path_map!(relative_path, document_id)
      end

      def import_folder(relative_path, document_id, parent_id: nil)
        space.insert_hierarchy_node!(document_id, parent_id: parent_id)
        session.merge_path_map!(relative_path, document_id)
      end

      def ids(nodes) = nodes.map { |node| node["id"] }

      it "puts imported siblings in folder-first, alphabetical order at every level" do
        # Completion order, as concurrent jobs would leave it
        import("zeta.md", "doc_zeta")
        import_folder("Notes", "doc_notes")
        import("Alpha.md", "doc_alpha")
        import_folder("Archive", "doc_archive")
        import("Notes/b.md", "doc_notes_b", parent_id: "doc_notes")
        import("Notes/a.md", "doc_notes_a", parent_id: "doc_notes")

        described_class.perform_now(session)

        hierarchy = space.reload.hierarchy
        expect(ids(hierarchy)).to eq(%w[doc_archive doc_notes doc_alpha doc_zeta])
        notes = hierarchy.find { |node| node["id"] == "doc_notes" }
        expect(ids(notes["children"])).to eq(%w[doc_notes_a doc_notes_b])
      end

      it "leaves documents that were already in the space where they were" do
        space.insert_hierarchy_node!("existing_first")
        import("b.md", "doc_b")
        space.insert_hierarchy_node!("existing_middle")
        import("a.md", "doc_a")

        described_class.perform_now(session)

        expect(ids(space.reload.hierarchy)).to eq(%w[existing_first doc_a existing_middle doc_b])
      end

      it "ignores attachments in the path map" do
        import("b.md", "doc_b")
        import("a.md", "doc_a")
        session.merge_path_map!("image.png", "attachment:123")

        described_class.perform_now(session)

        expect(ids(space.reload.hierarchy)).to eq(%w[doc_a doc_b])
      end
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
