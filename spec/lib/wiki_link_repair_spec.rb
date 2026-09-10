require "rails_helper"

RSpec.describe WikiLinkRepair do
  fixtures :organizations, :users, :spaces, :organization_memberships, :object_contents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  def new_document
    Document.create!(organization: organization, space: space, title: "Doc")
  end

  # The service reads the live Y.js body, so the stub stands in for decoding it.
  def prepare(document, blocks)
    allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(blocks)
    allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("new-sync")
    document.create_content!(sync: "s")
    document
  end

  def build_document(blocks) = prepare(new_document, blocks)

  def make_attachment(filename, parent)
    Attachment.create!(organization: organization, parent: parent, parent_type: "Document",
                       filename: filename, mime_type: "image/png")
  end

  def paragraph(text)
    { "id" => SecureRandom.uuid, "type" => "paragraph", "props" => {},
      "content" => [{ "type" => "text", "text" => text, "styles" => {} }], "children" => [] }
  end

  def image_block(attachment_id)
    { "id" => SecureRandom.uuid, "type" => "image",
      "props" => { "url" => "attachment:#{attachment_id}.png", "name" => "x.png" }, "children" => [] }
  end

  def run(document, **opts)
    described_class.new(document_id: document.id, **opts).run
  end

  describe "a link that duplicates an embed" do
    it "deletes an Open: link when the file is already embedded" do
      document = new_document
      att = make_attachment("photo.png", document)
      prepare(document, [paragraph("[[photo.png|Open: photo.png]] "), image_block(att.id)])

      result = run(document)

      expect(result[:counts][:deleted]).to eq(1)
      expect(result[:counts][:resolved]).to eq(0)
    end

    it "keeps a meaningful caption and drops the markup" do
      document = new_document
      att = make_attachment("photo.png", document)
      prepare(document, [paragraph("[[photo.png|Pierwsza wersja 2015-04-12]]"), image_block(att.id)])

      expect(run(document, apply: true)[:counts][:flattened]).to eq(1)

      text = document.versions.last.content_blocks.first["content"].map { |c| c["text"] }.join
      expect(text).to eq("Pierwsza wersja 2015-04-12")
    end

    it "does not confuse attachment:19 with attachment:195" do
      # A LIKE '%attachment:19%' test would call this already-embedded and delete the link.
      document = new_document
      make_attachment("wanted.png", document)
      other = make_attachment("other.png", document)
      prepare(document, [paragraph("[[wanted.png|Open: wanted.png]]"), image_block("#{other.id}5")])

      result = run(document)

      expect(result[:counts][:deleted]).to eq(0)
      expect(result[:counts][:resolved]).to eq(1)
    end

    it "recognises the embed even when it resolved to a duplicate attachment row" do
      # One vault file can have several attachment rows; production has 1573 and 1605 for
      # the same screenshot. Matching on id alone made every such link look unembedded and
      # turned 136 duplicate Open: links into inline links instead of deleting them.
      document = new_document
      other_doc = new_document
      make_attachment("photo.png", document)
      duplicate = make_attachment("photo.png", other_doc)
      prepare(document, [paragraph("[[photo.png|Open: photo.png]]"), image_block(duplicate.id)])

      result = run(document)

      expect(result[:counts][:deleted]).to eq(1)
      expect(result[:counts][:resolved]).to eq(0)
    end
  end

  describe "a link with no embed" do
    it "becomes an inline link, splitting the surrounding text" do
      document = new_document
      att = make_attachment("report.pdf", document)
      prepare(document, [paragraph("see [[report.pdf|the report]] for detail")])

      run(document, apply: true)

      content = document.versions.last.content_blocks.first["content"]
      expect(content.map { |c| c["type"] }).to eq(%w[text link text])
      expect(content[0]["text"]).to eq("see ")
      expect(content[1]["href"]).to eq("/attachments/#{att.id}")
      expect(content[1]["content"].first["text"]).to eq("the report")
      expect(content[2]["text"]).to eq(" for detail")
    end
  end

  describe "things it must not touch" do
    it "leaves a document link alone" do
      document = build_document([paragraph("Pierwszy dochód mieliśmy [[2017-10-31]]")])

      result = run(document)

      expect(result[:documents_changed]).to eq(0)
      expect(result[:counts][:skipped_not_a_file]).to eq(1)
    end

    it "leaves a document link whose name merely looks like a filename" do
      document = build_document([paragraph("[[Suplementy z meskaklinika.pl|które biorę]]")])

      expect(run(document)[:documents_changed]).to eq(0)
    end

    it "leaves a file link alone when no attachment exists" do
      document = build_document([paragraph("[[never-uploaded.png|Open: never-uploaded.png]]")])

      result = run(document)

      expect(result[:documents_changed]).to eq(0)
      expect(result[:counts][:skipped_no_attachment]).to eq(1)
    end

    it "counts embeds but does not rewrite them" do
      document = build_document([paragraph("![[photo.png]]")])

      result = run(document)

      expect(result[:counts][:embeds_left]).to eq(1)
      expect(result[:documents_changed]).to eq(0)
    end
  end

  it "writes nothing in dry run" do
    document = new_document
    make_attachment("report.pdf", document)
    prepare(document, [paragraph("see [[report.pdf|the report]]")])

    expect { run(document) }.not_to change { document.versions.count }
    expect(document.content.reload.sync).to eq("s")
  end
end
