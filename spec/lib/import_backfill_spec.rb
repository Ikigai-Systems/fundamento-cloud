require "rails_helper"

RSpec.describe ImportBackfill do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  let(:session) do
    ImportSession.create!(organization: organization, space: space,
                          organization_membership: membership,
                          status: :completed, source_format: "obsidian")
  end

  def new_document(title = "Doc")
    Document.create!(organization: organization, space: space, title: title)
  end

  def import_file_for(document, path, format: "docx", content: "PK\x03\x04docx")
    file = ImportFile.create!(import_session: session, relative_path: path, format: format,
                              file_type: :document, status: :completed, document: document)
    file.file.attach(io: StringIO.new(content), filename: File.basename(path),
                     content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    file
  end

  def mention_block(title, entity_id)
    { "id" => "b1", "type" => "paragraph", "props" => {}, "children" => [],
      "content" => [{ "type" => "mention",
                      "props" => { "id" => "m1", "entity" => "document",
                                   "entityId" => entity_id, "title" => title } }] }
  end

  def prepare(document, blocks)
    allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(blocks)
    allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("new-sync")
    document.versions.create!(content_blocks: blocks, created_by: membership.user)
    document.update_column(:sync, "s")
    document
  end

  describe "converted sources" do
    it "attaches the original file to the document it produced" do
      document = new_document
      import_file_for(document, "MBA/Plan ed.16.docx")

      result = described_class.new(apply: true).run

      expect(result[:sources_attached]).to eq(1)
      attachment = Attachment.find_by(parent_id: document.id, parent_type: "Document")
      expect(attachment.filename).to eq("Plan ed.16.docx")
      expect(attachment.file).to be_attached
    end

    it "is idempotent" do
      document = new_document
      import_file_for(document, "MBA/Plan ed.16.docx")
      described_class.new(apply: true).run

      expect { described_class.new(apply: true).run }.not_to change(Attachment, :count)
    end

    it "ignores markdown documents" do
      document = new_document
      import_file_for(document, "Notes/hello.md", format: "markdown", content: "# hi")

      expect(described_class.new(apply: true).run[:sources_attached]).to eq(0)
    end
  end

  describe "broken mentions" do
    it "repairs a mention whose target was converted to a document" do
      target = new_document("Plan")
      session.merge_path_map!("MBA/Pliki/Plan ed.16.docx", target.id)
      document = prepare(new_document, [mention_block("Plan ed.16.docx", "")])

      result = described_class.new(apply: true).run

      expect(result[:mentions_fixed]).to eq(1)
      mention = document.versions.last.content_blocks.first["content"].first
      expect(mention["props"]["entityId"]).to eq(target.id)
    end

    it "leaves a mention alone when the target genuinely does not exist" do
      # 1331 of 1340 broken mentions on the real import are this case -- notes that were
      # never in the vault. Rewriting them would invent links that never existed.
      session.merge_path_map!("Notes/something-else.md", new_document("Other").id)
      document = prepare(new_document, [mention_block("2017-10-31", "")])

      result = described_class.new(apply: true).run

      expect(result[:mentions_fixed]).to eq(0)
      expect(result[:mentions_left_broken]).to eq(1)
      expect(document.versions.count).to eq(1)
    end

    it "does not turn a mention into an attachment reference" do
      session.merge_path_map!("Pliki/photo.png", "attachment:42.png")
      document = prepare(new_document, [mention_block("photo.png", "")])

      expect(described_class.new(apply: true).run[:mentions_fixed]).to eq(0)
    end
  end

  it "writes nothing in dry run" do
    document = new_document
    import_file_for(document, "MBA/Plan ed.16.docx")
    target = new_document("Plan")
    session.merge_path_map!("MBA/Pliki/Plan ed.16.docx", target.id)
    prepare(new_document, [mention_block("Plan ed.16.docx", "")])

    result = described_class.new.run

    expect(result[:mode]).to eq("dry run")
    expect(result[:sources_attached]).to be > 0
    expect(Attachment.count).to eq(0)
  end
end
