require "rails_helper"
require "vips"

RSpec.describe ReadAttachmentTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :object_contents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }
  let(:server_context) { {user_id: user.id, organization_id: organization.id} }

  def attach(bytes, filename:, mime_type:, parent: document, organization: self.organization)
    Attachment.create!(organization: organization, parent: parent, filename: filename, mime_type: mime_type).tap do |attachment|
      attachment.file.attach(io: StringIO.new(bytes), filename: filename, content_type: mime_type)
    end
  end

  def call(attachment, context = server_context)
    described_class.call(id: attachment.id, server_context: context)
  end

  def meta(response) = JSON.parse(response.content.first[:text])

  def png(width, height, format: ".png") = Vips::Image.black(width, height).write_to_buffer(format)

  describe "an image" do
    it "comes back as an image a model can look at, with its size and type" do
      attachment = attach(png(40, 30), filename: "shot.png", mime_type: "image/png")

      response = call(attachment)

      expect(response.error?).to be_falsey
      expect(meta(response)).to include("name" => "shot.png", "mime_type" => "image/png", "width" => 40, "height" => 30)
      image = response.content.second
      expect(image[:type]).to eq("image")
      expect(image[:mimeType]).to eq("image/png")
      expect(Vips::Image.new_from_buffer(Base64.decode64(image[:data]), "").size).to eq([40, 30])
    end

    it "is scaled down to the edge limit when it is larger" do
      attachment = attach(png(3000, 1500), filename: "big.png", mime_type: "image/png")

      response = call(attachment)

      width, height = Vips::Image.new_from_buffer(Base64.decode64(response.content.second[:data]), "").size
      expect([width, height].max).to eq(ReadAttachmentTool::MAX_IMAGE_EDGE)
      expect(meta(response)).to include("width" => width, "height" => height)
    end

    it "keeps a large jpeg a jpeg" do
      attachment = attach(png(2000, 1000, format: ".jpg"), filename: "photo.jpg", mime_type: "image/jpeg")

      response = call(attachment)

      expect(response.content.second[:mimeType]).to eq("image/jpeg")
    end

    it "turns a gif into a png" do
      attachment = attach(png(20, 20, format: ".gif"), filename: "anim.gif", mime_type: "image/gif")

      response = call(attachment)

      expect(response.content.second[:mimeType]).to eq("image/png")
    end

    it "is refused above the size limit, saying why, without being downloaded" do
      attachment = attach("x", filename: "huge.png", mime_type: "image/png")
      stub_const("ReadAttachmentTool::MAX_SOURCE_BYTES", 0)
      expect_any_instance_of(ActiveStorage::Blob).not_to receive(:download)

      response = call(attachment)

      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("too_large")
    end

    it "is refused when it has too many pixels, whatever its size in bytes" do
      attachment = attach(png(100, 100), filename: "bomb.png", mime_type: "image/png")
      stub_const("ReadAttachmentTool::MAX_IMAGE_PIXELS", 100)

      response = call(attachment)

      expect(response.error?).to be true
      expect(response.structured_content[:message]).to include("100 x 100 pixels")
    end

    it "is what its content is, not what its stored type says" do
      attachment = attach(png(10, 10, format: ".jpg"), filename: "liar.png", mime_type: "image/png")

      response = call(attachment)

      expect(response.content.second[:mimeType]).to eq("image/png")
      expect(Vips::Image.new_from_buffer(Base64.decode64(response.content.second[:data]), "").get("vips-loader")).to eq("pngload_buffer")
    end

    it "is not read when a file over the limit is not an image either" do
      attachment = attach("text", filename: "big.txt", mime_type: "text/plain")
      stub_const("ReadAttachmentTool::MAX_SOURCE_BYTES", 1)

      expect(call(attachment).structured_content[:error]).to eq("too_large")
    end

    it "says so when the file is not a decodable image" do
      attachment = attach("not an image", filename: "broken.png", mime_type: "image/png")

      response = call(attachment)

      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("unreadable")
    end
  end

  describe "a text file" do
    it "comes back as text, by type or by extension" do
      csv = attach("a,b\n1,2\n", filename: "data.csv", mime_type: "application/vnd.ms-excel")
      json = attach('{"a":1}', filename: "x.json", mime_type: "application/json")

      expect(call(csv).content.second[:text]).to eq("a,b\n1,2\n")
      expect(call(json).content.second[:text]).to eq('{"a":1}')
      expect(meta(call(csv))).to include("truncated" => false)
    end

    it "is cut at the character limit, and says so" do
      stub_const("ReadAttachmentTool::MAX_TEXT_CHARS", 5)
      attachment = attach("0123456789", filename: "long.txt", mime_type: "text/plain")

      response = call(attachment)

      expect(meta(response)).to include("truncated" => true)
      expect(response.content.second[:text]).to start_with("01234").and include("Cut at 5 of 10 characters")
    end

    it "survives bytes that are not UTF-8" do
      attachment = attach("caf\xE9".b, filename: "latin1.txt", mime_type: "text/plain")

      expect(call(attachment).content.second[:text]).to start_with("caf")
    end
  end

  it "gives other files as their name, type and size only" do
    attachment = attach("%PDF-1.4", filename: "report.pdf", mime_type: "application/pdf")

    response = call(attachment)

    expect(response.content.size).to eq(1)
    expect(meta(response)).to include("name" => "report.pdf", "size" => 8, "readable" => false)
  end

  it "reads an attachment stored in the database, from before Active Storage" do
    attachment = Attachment.create!(organization: organization, parent: document, filename: "old.txt", mime_type: "text/plain", data: "old data")

    expect(call(attachment).content.second[:text]).to eq("old data")
  end

  it "takes the id as it appears in a document, with the attachment: prefix and an extension" do
    attachment = attach(png(4, 4), filename: "shot.png", mime_type: "image/png")

    response = described_class.call(id: "attachment:#{attachment.id}.png", server_context: server_context)

    expect(response.error?).to be_falsey
  end

  it "does not find an attachment of another organization" do
    other = organizations(:hc)
    attachment = attach("secret", filename: "s.txt", mime_type: "text/plain", parent: documents(:one), organization: other)

    response = call(attachment)

    expect(response.error?).to be true
    expect(response.structured_content[:error]).to eq("not_found")
  end

  it "refuses a user who may not see the document it belongs to" do
    attachment = attach("private", filename: "p.txt", mime_type: "text/plain")
    document.space.update!(access_mode: :private)
    stefan = {user_id: users(:stefan).id, organization_id: organization.id}

    response = call(attachment, stefan)

    expect(response.error?).to be true
    expect(response.structured_content[:error]).to eq("unauthorized")
  end
end
