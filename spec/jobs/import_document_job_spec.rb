require "rails_helper"

RSpec.describe ImportDocumentJob, type: :job do
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

  def build_import_file(relative_path:, format: "markdown", content: "# Hello\n\nWorld")
    import_file = ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: :document,
      format: format,
      status: :uploaded,
      checksum: Digest::SHA256.hexdigest(content),
      file_size: content.bytesize
    )
    import_file.file.attach(
      io: StringIO.new(content),
      filename: File.basename(relative_path),
      content_type: "text/markdown"
    )
    import_file
  end

  describe "keeping the source of a converted document" do
    it "attaches the original .docx to the document it produced" do
      # Without this the source is unreachable after import: the document holds only the
      # converted text. A .doc, which cannot be converted, is kept as an attachment --
      # so the same folder gave opposite outcomes depending on the extension.
      import_file = build_import_file(relative_path: "Notes/Plan.docx", format: "docx", content: "PK\x03\x04docx")
      allow(PandocConverterService).to receive(:file_to_markdown).and_return("# Plan\n\nBody")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      document = import_file.reload.document
      attachment = Attachment.find_by(parent_id: document.id, parent_type: "Document")
      expect(attachment).to be_present
      expect(attachment.filename).to eq("Plan.docx")
      expect(attachment.file).to be_attached
    end

    it "picks up any converted format, not a hardcoded list" do
      expect(ImportFile::CONVERTED_DOCUMENT_FORMATS)
        .to match_array(ImportFile::SUPPORTED_DOCUMENT_FORMATS - ["markdown"])
    end

    it "does not attach anything for a markdown document" do
      import_file = build_import_file(relative_path: "Notes/hello.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      expect(Attachment.where(parent_id: import_file.reload.document_id, parent_type: "Document")).to be_empty
    end
  end

  describe "#perform" do
    it "creates a Document from a markdown file" do
      import_file = build_import_file(relative_path: "Notes/hello.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      expect {
        described_class.perform_now(import_file)
      }.to change(Document, :count).by(1)

      import_file.reload
      expect(import_file).to be_completed
      expect(import_file.document).to be_present
      expect(import_file.processed_at).to be_present
    end

    it "sets the document title from filename when no frontmatter title" do
      import_file = build_import_file(relative_path: "Notes/my-note.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      expect(import_file.reload.document.title).to eq("my-note")
    end

    it "uses frontmatter title when present" do
      content = "---\ntitle: My Custom Title\n---\n\nBody text"
      import_file = build_import_file(relative_path: "Notes/file.md", content: content)
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      expect(import_file.reload.document.title).to eq("My Custom Title")
    end

    it "marks as failed and records error on conversion failure" do
      import_file = build_import_file(relative_path: "Notes/bad.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
        .and_raise(BlocknoteConverterService::ConversionError, "boom")

      described_class.perform_now(import_file)

      import_file.reload
      expect(import_file).to be_failed
      expect(import_file.error_message).to include("boom")
    end

    it "increments session processed_files on success" do
      import_file = build_import_file(relative_path: "note.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.processed_files }.by(1)
    end

    it "increments session failed_files on failure" do
      import_file = build_import_file(relative_path: "bad.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
        .and_raise(BlocknoteConverterService::ConversionError)

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.failed_files }.by(1)
    end

    context "when frontmatter contains tags" do
      before do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")
      end

      it "applies valid tags to the document" do
        content = "---\ntags:\n  - project\n  - work/2024\n---\n\nBody"
        import_file = build_import_file(relative_path: "tagged.md", content: content)

        described_class.perform_now(import_file)

        expect(import_file.reload.document.tags.pluck(:name)).to contain_exactly("project", "work/2024")
      end

      it "silently skips invalid tags and still imports the document" do
        content = "---\ntags:\n  - valid-tag\n  - \"invalid tag with spaces\"\n  - another@invalid\n---\n\nBody"
        import_file = build_import_file(relative_path: "mixed-tags.md", content: content)

        expect {
          described_class.perform_now(import_file)
        }.to change(Document, :count).by(1)

        import_file.reload
        expect(import_file).to be_completed
        expect(import_file.document.tags.pluck(:name)).to contain_exactly("valid-tag")
      end

      it "succeeds with no tags when all tags are invalid" do
        content = "---\ntags:\n  - \"bad tag!\"\n  - \"another bad one\"\n---\n\nBody"
        import_file = build_import_file(relative_path: "all-invalid-tags.md", content: content)

        expect {
          described_class.perform_now(import_file)
        }.to change(Document, :count).by(1)

        import_file.reload
        expect(import_file).to be_completed
        expect(import_file.document.tags).to be_empty
      end
    end

    context "when the file is stuck in :processing (interrupted job retry)" do
      it "processes the file instead of returning early" do
        import_file = build_import_file(relative_path: "interrupted.md")
        import_file.update_column(:status, ImportFile.statuses[:processing])

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

        expect {
          described_class.perform_now(import_file)
        }.to change(Document, :count).by(1)

        expect(import_file.reload).to be_completed
      end

      it "does not create a duplicate document if already completed" do
        import_file = build_import_file(relative_path: "done.md")
        existing_doc = space.documents.create!(organization: org, title: "done")
        import_file.update_columns(
          status: ImportFile.statuses[:completed],
          document_id: existing_doc.id
        )

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

        expect {
          described_class.perform_now(import_file)
        }.not_to change(Document, :count)
      end
    end

    context "hierarchy placement" do
      before do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")
      end

      def hierarchy_ids(nodes = Space.find(space.id).hierarchy, collected = [])
        Array(nodes).each do |node|
          collected << node["id"]
          hierarchy_ids(node["children"], collected)
        end
        collected
      end

      it "places the document at the root when its parent is missing from the hierarchy" do
        # The parent directory document's own node was lost, so add_item_to_hierarchy!
        # returns nil. Without a fallback the document imports fine but never appears.
        session.merge_path_map!("Notes", "ghost_parent")
        import_file = build_import_file(relative_path: "Notes/hello.md")

        described_class.perform_now(import_file)

        expect(hierarchy_ids).to include(import_file.reload.document_id)
      end

      it "does not clobber a node written by a concurrent worker" do
        # Root-level path on purpose: a nested path makes the job call session.reload in
        # parent_document_id, which clears the association cache this test depends on.
        import_file = build_import_file(relative_path: "note.md")
        import_file.import_session.space.hierarchy # warm the copy the job will hold

        # Stand-in for another pod's job committing its node mid-flight.
        Space.find(space.id).update!(hierarchy: [{ "id" => "written_elsewhere", "children" => [] }])

        described_class.perform_now(import_file)

        expect(hierarchy_ids).to contain_exactly("written_elsewhere", import_file.reload.document_id)
      end
    end

    context "database connection ownership" do
      # GoodJob runs each job inside `connection_pool.with_connection` and then reuses
      # that very connection to release the job's session advisory lock. Handing it back
      # to the pool mid-job lets another worker thread check it out, and two threads
      # driving one libpq handle desync the wire protocol -- surfacing as
      # `undefined method 'cmd_tuples' for nil` out of GoodJob's advisory unlock.
      it "does not return its caller's connection to the pool" do
        import_file = build_import_file(relative_path: "Notes/hello.md")
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

        pool = ActiveRecord::Base.connection_pool
        checkins = 0

        pool.with_connection do |conn|
          allow(pool).to receive(:checkin).and_wrap_original do |original, connection|
            checkins += 1 if connection.equal?(conn)
            original.call(connection)
          end

          described_class.perform_now(import_file)
        end

        expect(checkins).to eq(0)
      end
    end
  end
end
