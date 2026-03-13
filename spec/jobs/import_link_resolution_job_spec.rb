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
end
