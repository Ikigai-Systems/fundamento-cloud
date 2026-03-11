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

    it "replaces unresolvable [[link]] with broken-link marker" do
      path_map = {}
      markdown = "See [[missing]] here"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("[[missing]]")
      expect(result).to include("broken_link")
    end

    it "replaces ![[image.png]] with attachment reference" do
      path_map = { "assets/image.png" => "attachment:42" }
      markdown = "Here ![[image.png]] is shown"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("attachment:42")
    end
  end
end
