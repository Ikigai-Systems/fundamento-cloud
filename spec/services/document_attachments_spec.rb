require "rails_helper"

RSpec.describe DocumentAttachments do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :object_contents

  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }
  let(:other_document) { documents(:two) }
  let(:pundit_user) { PolicyUserContext.new(users(:pawel), organization) }

  def attach(parent:, filename:, mime_type: "image/png")
    Attachment.create!(organization: organization, parent: parent, filename: filename, mime_type: mime_type).tap do |attachment|
      attachment.file.attach(io: StringIO.new("12345"), filename: filename, content_type: mime_type)
    end
  end

  def blocks_for(*attachments)
    attachments.map { |attachment| {"id" => "block-#{attachment.id}", "type" => "image", "props" => {"url" => "attachment:#{attachment.id}"}} }
  end

  def list(blocks, user: pundit_user) = described_class.call(document: document, blocks: blocks, pundit_user: user)

  it "lists what the blocks point at, with name, type, size and the block, whoever the attachment belongs to" do
    mine = attach(parent: document, filename: "mine.png")
    elsewhere = attach(parent: other_document, filename: "elsewhere.png")

    expect(list(blocks_for(mine, elsewhere))).to eq([
      {id: mine.id, name: "mine.png", mime_type: "image/png", size: 5, block_id: "block-#{mine.id}"},
      {id: elsewhere.id, name: "elsewhere.png", mime_type: "image/png", size: 5, block_id: "block-#{elsewhere.id}"},
    ])
  end

  it "leaves out one the content no longer mentions, though it belongs to the document" do
    attach(parent: document, filename: "removed.png")

    expect(list([{"id" => "b", "type" => "paragraph", "content" => []}])).to eq([])
  end

  it "leaves out a reference that matches nothing, and one of another organization" do
    foreign = Attachment.create!(organization: organizations(:hc), parent: documents(:one), filename: "f.png", mime_type: "image/png")

    expect(list([{"id" => "b", "type" => "image", "props" => {"url" => "attachment:missing"}}, *blocks_for(foreign)])).to eq([])
  end

  it "leaves out one the reader may not see, because its document is private" do
    private_space = Space.create!(organization: organization, name: "Hidden", access_mode: :private)
    hidden_document = Document.create!(space: private_space, organization: organization, title: "Hidden")
    hidden = attach(parent: hidden_document, filename: "hidden.png")
    reader = PolicyUserContext.new(users(:stefan), organization)
    allowed = attach(parent: document, filename: "ok.png")

    expect(list(blocks_for(hidden, allowed), user: reader).map { |entry| entry[:name] }).to eq(["ok.png"])
  end

  it "does no work for blocks without attachments" do
    expect(Attachment).not_to receive(:resolve_many)

    expect(list([{"id" => "b", "type" => "paragraph", "content" => []}])).to eq([])
  end
end
