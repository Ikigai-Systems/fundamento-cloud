require "rails_helper"

RSpec.describe AttachmentHrefNormalizer do
  fixtures :organizations, :users, :spaces, :organization_memberships, :object_contents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  def new_document = Document.create!(organization: organization, space: space, title: "Doc")

  def make_attachment(document)
    Attachment.create!(organization: organization, parent: document, parent_type: "Document",
                       filename: "photo.png", mime_type: "image/png")
  end

  def paragraph_with_link(href, label = "the photo")
    { "id" => "b1", "type" => "paragraph", "props" => {}, "children" => [],
      "content" => [{ "type" => "link", "href" => href,
                      "content" => [{ "type" => "text", "text" => label, "styles" => {} }] }] }
  end

  def prepare(document, blocks)
    allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(blocks)
    allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("new-sync")
    document.versions.create!(content_blocks: blocks, created_by: users(:pawel))
    document.create_content!(sync: "s")
    document
  end

  def href_of(document)
    document.versions.last.content_blocks.first["content"].first["href"]
  end

  it "rewrites a resolved path back to the internal form" do
    document = new_document
    attachment = make_attachment(document)
    prepare(document, [paragraph_with_link("/attachments/#{attachment.id}")])

    result = described_class.new(apply: true).run

    expect(result[:hrefs_rewritten]).to eq(1)
    expect(href_of(document)).to eq("attachment:#{attachment.id}")
  end

  it "leaves an external link alone" do
    document = new_document
    make_attachment(document)
    prepare(document, [paragraph_with_link("https://example.com/attachments/12")])

    expect(described_class.new(apply: true).run[:hrefs_rewritten]).to eq(0)
  end

  it "leaves a path carrying a query or fragment alone" do
    # The task only ever wrote bare paths, so anything else was typed by a person.
    document = new_document
    attachment = make_attachment(document)
    prepare(document, [paragraph_with_link("/attachments/#{attachment.id}?download=1")])

    expect(described_class.new(apply: true).run[:hrefs_rewritten]).to eq(0)
  end

  it "skips a path whose attachment no longer exists" do
    document = new_document
    prepare(document, [paragraph_with_link("/attachments/999999")])

    result = described_class.new(apply: true).run

    expect(result[:hrefs_rewritten]).to eq(0)
    expect(result[:skipped_unknown_attachment]).to eq(1)
  end

  it "is idempotent" do
    document = new_document
    attachment = make_attachment(document)
    prepare(document, [paragraph_with_link("attachment:#{attachment.id}")])

    expect(described_class.new(apply: true).run[:documents_changed]).to eq(0)
  end

  it "writes nothing in dry run" do
    document = new_document
    attachment = make_attachment(document)
    prepare(document, [paragraph_with_link("/attachments/#{attachment.id}")])

    result = described_class.new.run

    expect(result[:hrefs_rewritten]).to eq(1)
    expect(href_of(document)).to eq("/attachments/#{attachment.id}")
  end
end
