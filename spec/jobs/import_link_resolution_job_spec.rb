require "rails_helper"

RSpec.describe ImportLinkResolutionJob, type: :job do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing,
      source_format: "obsidian"
    )
  end

  def make_document(title:, path:)
    doc = Document.create!(organization: org, space: space, title: title)
    session.merge_path_map!(path, doc.id)
    doc
  end

  describe "#wiki_link_targets" do
    subject { described_class.new }

    it "resolves [[filename]] by basename" do
      path_map = { "Notes/foo.md" => "doc1", "Notes/bar.md" => "doc2" }
      expect(subject.send(:resolve_wiki_link, "foo", path_map)).to eq("doc1")
    end

    it "resolves [[path/to/file]] by full path" do
      path_map = { "Notes/foo.md" => "doc1" }
      expect(subject.send(:resolve_wiki_link, "Notes/foo", path_map)).to eq("doc1")
    end

    it "returns nil for unresolvable links" do
      path_map = {}
      expect(subject.send(:resolve_wiki_link, "missing", path_map)).to be_nil
    end
  end

  describe "#process_wiki_links_in_markdown" do
    subject { described_class.new }

    it "replaces [[link]] with fundamento link syntax" do
      path_map = { "Notes/foo.md" => "doc_abc" }
      markdown = "See [[foo]] for details"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("doc_abc")
      expect(result).not_to include("[[foo]]")
    end

    it "replaces unresolvable [[link]] with mention span with empty entity-id" do
      path_map = {}
      markdown = "See [[missing]] here"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include('<span data-mention="document" data-entity-id="">missing</span>')
      expect(result).not_to include("[[missing]]")
    end

    it "replaces ![[image.png]] with attachment reference" do
      path_map = { "assets/image.png" => "attachment:42" }
      markdown = "Here ![[image.png]] is shown"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("attachment:42")
    end

    it "rewrites standard markdown ![alt](path) to attachment URI" do
      path_map = { "Pliki/photo.png" => "attachment:42" }
      result = subject.send(:process_wiki_links_in_markdown, "See ![a photo](Pliki/photo.png) here", path_map)
      expect(result).to include("![a photo](attachment:42)")
    end

    it "rewrites standard markdown ![alt](<path with spaces>) to attachment URI" do
      path_map = { "Pliki/2022-12-09 02.29.53 video.mp4" => "attachment:99" }
      result = subject.send(:process_wiki_links_in_markdown,
        "![2022-12-09 02.29.53 video.mp4](<Pliki/2022-12-09 02.29.53 video.mp4>)",
        path_map)
      expect(result).to include("![2022-12-09 02.29.53 video.mp4](attachment:99)")
    end

    it "leaves external URLs in standard markdown image syntax unchanged" do
      result = subject.send(:process_wiki_links_in_markdown,
        "See ![photo](https://example.com/photo.png)", {})
      expect(result).to include("![photo](https://example.com/photo.png)")
    end

    it "leaves already-resolved attachment URIs unchanged" do
      path_map = {}
      result = subject.send(:process_wiki_links_in_markdown,
        "See ![photo](attachment:42)", path_map)
      expect(result).to include("![photo](attachment:42)")
    end
  end

  describe "process_wiki_links_in_markdown with mention spans" do
    let(:job) { ImportLinkResolutionJob.new }

    it "converts resolved wiki link to data-mention span" do
      combined_map = { "project.md" => "doc_abc" }
      result = job.send(:process_wiki_links_in_markdown, "See [[project]]", combined_map)

      expect(result).to include('<span data-mention="document" data-entity-id="doc_abc">project</span>')
    end

    it "converts broken wiki link to data-mention span with empty entity-id" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[missing]]", combined_map)

      expect(result).to include('<span data-mention="document" data-entity-id="">missing</span>')
    end

    it "uses alias text as display text" do
      combined_map = { "project.md" => "doc_abc" }
      result = job.send(:process_wiki_links_in_markdown, "See [[project|My Project]]", combined_map)

      expect(result).to include('<span data-mention="document" data-entity-id="doc_abc">My Project</span>')
    end

    it "uses alias text for broken links" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[missing|Display Name]]", combined_map)

      expect(result).to include('<span data-mention="document" data-entity-id="">Display Name</span>')
    end

    it "does not produce strikethrough broken_link markers anymore" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[missing]]", combined_map)

      expect(result).not_to include("~~")
      expect(result).not_to include(".broken_link")
    end

    it "converts [[attachment.png]] resolved to attachment: URI into image markdown" do
      combined_map = { "images/photo.png" => "attachment:42" }
      result = job.send(:process_wiki_links_in_markdown, "See [[images/photo.png]]", combined_map)

      expect(result).to include("![images/photo.png](attachment:42)")
      expect(result).not_to include("data-mention")
    end

    it "converts [[attachment.png|alias]] resolved to attachment: URI with alias" do
      combined_map = { "images/photo.png" => "attachment:42" }
      result = job.send(:process_wiki_links_in_markdown, "See [[images/photo.png|My Photo]]", combined_map)

      expect(result).to include("![My Photo](attachment:42)")
    end

    it "does not create broken document mention for unresolved file with attachment extension" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[missing-image.png]]", combined_map)

      expect(result).not_to include("data-mention")
      expect(result).to include("[[missing-image.png]]")
    end

    it "still creates broken document mention for unresolved link without file extension" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[some document]]", combined_map)

      expect(result).to include('<span data-mention="document" data-entity-id="">some document</span>')
    end

    it "still creates broken document mention for unresolved .md link" do
      combined_map = {}
      result = job.send(:process_wiki_links_in_markdown, "See [[notes.md]]", combined_map)

      expect(result).to include("data-mention")
    end
  end

  describe "heading and block reference handling" do
    let(:job) { ImportLinkResolutionJob.new }

    describe "#strip_obsidian_block_ids" do
      it "strips ^blockid markers at end of lines" do
        markdown = "This is a paragraph ^abc123\nAnother line"
        result = job.send(:strip_obsidian_block_ids, markdown)

        expect(result).to eq("This is a paragraph\nAnother line")
      end

      it "strips ^blockid with hyphens" do
        markdown = "Some text ^my-block-id"
        result = job.send(:strip_obsidian_block_ids, markdown)

        expect(result).to eq("Some text")
      end

      it "does not strip caret in middle of line" do
        markdown = "2^10 is 1024"
        result = job.send(:strip_obsidian_block_ids, markdown)

        expect(result).to eq("2^10 is 1024")
      end

      it "does not strip single-character block ids" do
        markdown = "Some text ^a"
        result = job.send(:strip_obsidian_block_ids, markdown)

        expect(result).to eq("Some text ^a")
      end
    end

    describe "[[doc#heading]] links" do
      it "includes data-fragment when heading matches a block in target document" do
        combined_map = { "project.md" => "doc_abc" }

        # Set up a target document with heading blocks
        doc = Document.create!(id: "doc_abc", organization: organizations(:is), space: spaces(:is_default), title: "Project")
        doc.versions.create!(
          content_blocks: [
            { "id" => "block-uuid-1", "type" => "heading", "props" => { "level" => 1 }, "content" => [{ "type" => "text", "text" => "GitGuardian" }], "children" => [] }
          ],
          created_by: users(:pawel)
        )

        result = job.send(:process_wiki_links_in_markdown, "See [[project#GitGuardian]]", combined_map)

        expect(result).to include('data-fragment="block-uuid-1"')
        expect(result).to include('data-entity-id="doc_abc"')
        expect(result).to include(">project</span>")
      end

      it "resolves heading case-insensitively" do
        combined_map = { "project.md" => "doc_abc" }

        doc = Document.create!(id: "doc_abc", organization: organizations(:is), space: spaces(:is_default), title: "Project")
        doc.versions.create!(
          content_blocks: [
            { "id" => "block-uuid-1", "type" => "heading", "props" => { "level" => 1 }, "content" => [{ "type" => "text", "text" => "My Heading" }], "children" => [] }
          ],
          created_by: users(:pawel)
        )

        result = job.send(:process_wiki_links_in_markdown, "See [[project#my heading]]", combined_map)

        expect(result).to include('data-fragment="block-uuid-1"')
      end

      it "omits data-fragment when heading does not match" do
        combined_map = { "project.md" => "doc_abc" }

        doc = Document.create!(id: "doc_abc", organization: organizations(:is), space: spaces(:is_default), title: "Project")
        doc.versions.create!(
          content_blocks: [
            { "id" => "block-uuid-1", "type" => "heading", "props" => { "level" => 1 }, "content" => [{ "type" => "text", "text" => "Other Heading" }], "children" => [] }
          ],
          created_by: users(:pawel)
        )

        result = job.send(:process_wiki_links_in_markdown, "See [[project#Nonexistent]]", combined_map)

        expect(result).not_to include("data-fragment")
        expect(result).to include('data-entity-id="doc_abc"')
      end

      it "uses alias text with heading links" do
        combined_map = { "project.md" => "doc_abc" }

        result = job.send(:process_wiki_links_in_markdown, "See [[project#Section|Custom Name]]", combined_map)

        expect(result).to include(">Custom Name</span>")
        expect(result).to include('data-entity-id="doc_abc"')
      end

      it "ignores ^blockref fragments (not yet supported)" do
        combined_map = { "project.md" => "doc_abc" }

        result = job.send(:process_wiki_links_in_markdown, "See [[project#^abc123]]", combined_map)

        expect(result).not_to include("data-fragment")
        expect(result).to include('data-entity-id="doc_abc"')
      end
    end

    describe "standard markdown media reference rewriting" do
      it "rewrites standard markdown image reference with plain path" do
        path_map = { "assets/photo.png" => "attachment:42" }
        result = job.send(:process_wiki_links_in_markdown, "See ![my photo](assets/photo.png) here", path_map)
        expect(result).to include("![my photo](attachment:42)")
      end

      it "rewrites standard markdown video reference with angle-bracket path (filename with spaces)" do
        path_map = { "Pliki/2022-12-09 02.29.53 video.mp4" => "attachment:99" }
        result = job.send(:process_wiki_links_in_markdown,
          "![2022-12-09 02.29.53 video.mp4](<Pliki/2022-12-09 02.29.53 video.mp4>)",
          path_map)
        expect(result).to include("![2022-12-09 02.29.53 video.mp4](attachment:99)")
      end

      it "does not rewrite external image URLs" do
        result = job.send(:process_wiki_links_in_markdown, "![img](https://example.com/img.png)", {})
        expect(result).to include("![img](https://example.com/img.png)")
      end
    end

    describe "integration: standard markdown media references in full job run" do
      let(:job) { ImportLinkResolutionJob.new }
      # vault_path: full path as stored in path_map (relative to vault root)
      # doc_relative_path: how the document references the file (relative to document's folder)
      let(:vault_path) { "Zaimportowane/Instagram/Redpill/Pliki/2022-12-09 02.29.53 video.mp4" }
      let(:doc_relative_path) { "Pliki/2022-12-09 02.29.53 video.mp4" }
      let(:video_markdown) { "![2022-12-09 02.29.53 video.mp4](<#{doc_relative_path}>)" }

      def make_import_file(document:, path:, markdown:)
        file = import_file_with_content(document, path, markdown)
        file
      end

      # Creates an ImportFile backed by an in-memory StringIO so no S3 call is needed
      def import_file_with_content(document, path, markdown)
        import_file = session.import_files.create!(
          relative_path: path,
          format: "markdown",
          file_type: :document,
          status: :completed,
          document: document
        )
        # Attach an in-memory file so import_file.file.open works
        import_file.file.attach(
          io: StringIO.new(markdown),
          filename: File.basename(path),
          content_type: "text/markdown"
        )
        import_file
      end

      it "resolves standard markdown video reference in a document without any wiki links" do
        doc = Document.create!(organization: org, space: space, title: "Notes")
        doc.versions.create!(
          content_blocks: [
            { "id" => "block-1", "type" => "video",
              "props" => { "url" => doc_relative_path, "name" => "video.mp4", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc, path: "Notes.md", markdown: video_markdown)
        session.merge_path_map!(vault_path, "attachment:99")

        batch = double("batch", properties: { import_session_id: session.id })
        allow(ImportSessionCompletionJob).to receive(:perform_later)

        job.perform(batch)

        new_blocks = doc.versions.last.content_blocks
        expect(new_blocks.first.dig("props", "url")).to eq("attachment:99")
      end

      it "resolves the same attachment referenced from two separate documents" do
        doc_a = Document.create!(organization: org, space: space, title: "Doc A")
        doc_a.versions.create!(
          content_blocks: [
            { "id" => "block-a", "type" => "video",
              "props" => { "url" => doc_relative_path, "name" => "video.mp4", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc_a, path: "DocA.md", markdown: video_markdown)

        doc_b = Document.create!(organization: org, space: space, title: "Doc B")
        doc_b.versions.create!(
          content_blocks: [
            { "id" => "block-b", "type" => "video",
              "props" => { "url" => doc_relative_path, "name" => "video.mp4", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc_b, path: "DocB.md", markdown: video_markdown)

        session.merge_path_map!(vault_path, "attachment:99")

        batch = double("batch", properties: { import_session_id: session.id })
        allow(ImportSessionCompletionJob).to receive(:perform_later)

        job.perform(batch)

        expect(doc_a.versions.last.content_blocks.first.dig("props", "url")).to eq("attachment:99")
        expect(doc_b.versions.last.content_blocks.first.dig("props", "url")).to eq("attachment:99")
      end

      it "produces a video block when the referenced file is a video" do
        doc = Document.create!(organization: org, space: space, title: "Notes")
        doc.versions.create!(
          content_blocks: [
            { "id" => "b1", "type" => "image",
              "props" => { "url" => "Pliki/clip.mp4", "name" => "clip.mp4", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc, path: "Notes.md", markdown: "![clip.mp4](<Pliki/clip.mp4>)")
        session.merge_path_map!("Vault/Pliki/clip.mp4", "attachment:55")

        video_block = { "id" => "b1", "type" => "image",
          "props" => { "url" => "attachment:55", "name" => "clip.mp4", "caption" => "" },
          "content" => [], "children" => [] }
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([video_block])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("sync_data")

        batch = double("batch", properties: { import_session_id: session.id })
        allow(ImportSessionCompletionJob).to receive(:perform_later)
        job.perform(batch)

        expect(doc.versions.last.content_blocks.first["type"]).to eq("video")
        expect(doc.versions.last.content_blocks.first.dig("props", "url")).to eq("attachment:55")
      end

      it "produces an audio block when the referenced file is audio" do
        doc = Document.create!(organization: org, space: space, title: "Notes")
        doc.versions.create!(
          content_blocks: [
            { "id" => "b1", "type" => "image",
              "props" => { "url" => "Pliki/track.mp3", "name" => "track.mp3", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc, path: "Notes.md", markdown: "![track.mp3](<Pliki/track.mp3>)")
        session.merge_path_map!("Vault/Pliki/track.mp3", "attachment:56")

        audio_block = { "id" => "b1", "type" => "image",
          "props" => { "url" => "attachment:56", "name" => "track.mp3", "caption" => "" },
          "content" => [], "children" => [] }
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([audio_block])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("sync_data")

        batch = double("batch", properties: { import_session_id: session.id })
        allow(ImportSessionCompletionJob).to receive(:perform_later)
        job.perform(batch)

        expect(doc.versions.last.content_blocks.first["type"]).to eq("audio")
        expect(doc.versions.last.content_blocks.first.dig("props", "url")).to eq("attachment:56")
      end

      it "produces a file block when the referenced file is a PDF" do
        doc = Document.create!(organization: org, space: space, title: "Notes")
        doc.versions.create!(
          content_blocks: [
            { "id" => "b1", "type" => "image",
              "props" => { "url" => "Pliki/report.pdf", "name" => "report.pdf", "caption" => "" },
              "content" => [], "children" => [] }
          ],
          created_by: membership.user
        )
        make_import_file(document: doc, path: "Notes.md", markdown: "![report.pdf](<Pliki/report.pdf>)")
        session.merge_path_map!("Vault/Pliki/report.pdf", "attachment:57")

        file_block = { "id" => "b1", "type" => "image",
          "props" => { "url" => "attachment:57", "name" => "report.pdf", "caption" => "" },
          "content" => [], "children" => [] }
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([file_block])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("sync_data")

        batch = double("batch", properties: { import_session_id: session.id })
        allow(ImportSessionCompletionJob).to receive(:perform_later)
        job.perform(batch)

        expect(doc.versions.last.content_blocks.first["type"]).to eq("file")
        expect(doc.versions.last.content_blocks.first.dig("props", "url")).to eq("attachment:57")
      end
    end

    describe "![[doc]] embed downgrade to mention" do
      it "converts ![[document]] embed to document mention when document resolves" do
        combined_map = { "project.md" => "doc_abc" }

        result = job.send(:process_wiki_links_in_markdown, "Here ![[project]] is embedded", combined_map)

        expect(result).to include('<span data-mention="document" data-entity-id="doc_abc">project</span>')
        expect(result).not_to include("![[")
      end

      it "converts ![[document#heading]] embed to mention with fragment" do
        combined_map = { "project.md" => "doc_abc" }

        doc = Document.create!(id: "doc_abc", organization: organizations(:is), space: spaces(:is_default), title: "Project")
        doc.versions.create!(
          content_blocks: [
            { "id" => "block-uuid-1", "type" => "heading", "props" => { "level" => 1 }, "content" => [{ "type" => "text", "text" => "GitGuardian" }], "children" => [] }
          ],
          created_by: users(:pawel)
        )

        result = job.send(:process_wiki_links_in_markdown, "Here ![[project#GitGuardian]]", combined_map)

        expect(result).to include('data-fragment="block-uuid-1"')
        expect(result).to include('data-entity-id="doc_abc"')
        expect(result).to include(">project</span>")
      end

      it "converts ![[document|alias]] embed to mention with alias" do
        combined_map = { "project.md" => "doc_abc" }

        result = job.send(:process_wiki_links_in_markdown, "Here ![[project|My Project]]", combined_map)

        expect(result).to include(">My Project</span>")
        expect(result).to include('data-entity-id="doc_abc"')
      end

      it "leaves ![[unresolved]] as-is" do
        combined_map = {}

        result = job.send(:process_wiki_links_in_markdown, "Here ![[unknown document]]", combined_map)

        expect(result).to include("![[unknown document]]")
        expect(result).not_to include("data-mention")
      end

      it "still resolves ![[attachment.png]] as image" do
        combined_map = { "assets/photo.png" => "attachment:42" }

        result = job.send(:process_wiki_links_in_markdown, "Here ![[photo.png]]", combined_map)

        expect(result).to include("![photo.png](attachment:42)")
        expect(result).not_to include("data-mention")
      end
    end
  end

  describe "#fix_media_block_types!" do
    subject { described_class.new }

    let(:path_map) do
      {
        "Pliki/video.mp4" => "attachment:10",
        "Pliki/audio.mp3" => "attachment:11",
        "Pliki/doc.pdf"   => "attachment:12",
        "Pliki/photo.png" => "attachment:13",
      }
    end

    def image_block(url, id: "block-1")
      { "id" => id, "type" => "image", "props" => { "url" => url, "name" => "file", "caption" => "", "showPreview" => true }, "children" => [] }
    end

    it "changes video attachment to video block type" do
      blocks = [image_block("attachment:10")]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("video")
    end

    it "changes audio attachment to audio block type" do
      blocks = [image_block("attachment:11")]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("audio")
    end

    it "changes PDF attachment to file block type" do
      blocks = [image_block("attachment:12")]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("file")
    end

    it "leaves image attachment as image block type" do
      blocks = [image_block("attachment:13")]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("image")
    end

    it "ignores blocks that are not image type" do
      blocks = [{ "id" => "b1", "type" => "paragraph", "content" => [], "children" => [] }]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("paragraph")
    end

    it "ignores image blocks with non-attachment URLs" do
      blocks = [image_block("https://example.com/photo.jpg")]
      subject.send(:fix_media_block_types!, blocks, path_map)
      expect(blocks.first["type"]).to eq("image")
    end

    it "processes blocks nested in children" do
      inner = image_block("attachment:10", id: "inner")
      outer = { "id" => "outer", "type" => "paragraph", "content" => [], "children" => [inner] }
      subject.send(:fix_media_block_types!, [outer], path_map)
      expect(inner["type"]).to eq("video")
    end
  end
end
