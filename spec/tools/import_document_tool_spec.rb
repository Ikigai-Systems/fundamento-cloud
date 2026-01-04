require "rails_helper"

RSpec.describe ImportDocumentTool do
  fixtures :organizations, :users, :organization_users, :spaces

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_users(:ou_is_pawel) }

  let(:server_context) do
    {
      user_id: pawel.id,
      organization_id: ikigai_systems.id,
    }
  end

  describe ".call" do
    it "imports document from Base64-encoded DOCX file" do
      file_content = file_fixture("pandoc/Volume-2-Terms-of-Reference.docx").read
      base64_content = Base64.strict_encode64(file_content)

      expect {
        described_class.call(
          space_npi: is_default_space.id,
          file_content: base64_content,
          filename: "Volume-2-Terms-of-Reference.docx",
          title: "MCP Imported Document",
          server_context: server_context
        )
      }.to change(Document, :count).by(1)

      document = Document.last
      expect(document.title).to eq("MCP Imported Document")
      expect(document.space).to eq(is_default_space)
    end

    it "imports document from Base64-encoded ODT file" do
      file_content = file_fixture("pandoc/Volume-2-Terms-of-Reference.odt").read
      base64_content = Base64.strict_encode64(file_content)

      expect {
        described_class.call(
          space_npi: is_default_space.id,
          file_content: base64_content,
          filename: "Volume-2-Terms-of-Reference.odt",
          server_context: server_context
        )
      }.to change(Document, :count).by(1)

      document = Document.last
      expect(document.space).to eq(is_default_space)
    end

    it "uses filename as title when not provided" do
      file_content = file_fixture("pandoc/Volume-2-Terms-of-Reference.docx").read
      base64_content = Base64.strict_encode64(file_content)

      described_class.call(
        space_npi: is_default_space.id,
        file_content: base64_content,
        filename: "my-document.docx",
        server_context: server_context
      )

      document = Document.last
      expect(document.title).to eq("my-document")
    end

    it "creates nested document when parent_document_npi provided" do
      parent_doc = is_default_space.documents.create!(
        title: "Parent",
        organization: ikigai_systems
      )

      # Add parent to hierarchy
      hierarchy_node = is_default_space.create_hierarchy_node(parent_doc.id)
      is_default_space.hierarchy.append(hierarchy_node)
      is_default_space.save!

      file_content = file_fixture("pandoc/Volume-2-Terms-of-Reference.docx").read
      base64_content = Base64.strict_encode64(file_content)

      described_class.call(
        space_npi: is_default_space.id,
        file_content: base64_content,
        filename: "child.docx",
        parent_document_npi: parent_doc.npi,
        server_context: server_context
      )

      is_default_space.reload
      document = Document.last
      parent_node = is_default_space.hierarchy.find { |node| node["id"] == parent_doc.id }
      expect(parent_node["children"]).to include(
        hash_including("id" => document.id)
      )
    end

    it "raises error for unsupported file types" do
      file_content = file_fixture("pandoc/malware.exe").read
      base64_content = Base64.strict_encode64(file_content)

      expect {
        described_class.call(
          space_npi: is_default_space.id,
          file_content: base64_content,
          filename: "malware.exe",
          server_context: server_context
        )
      }.to raise_error(PandocConverterService::ConversionError, /Unsupported file type/)
    end

    it "returns DocumentBlueprint MCP response" do
      file_content = file_fixture("pandoc/Volume-2-Terms-of-Reference.docx").read
      base64_content = Base64.strict_encode64(file_content)

      response = described_class.call(
        space_npi: is_default_space.id,
        file_content: base64_content,
        filename: "Volume-2-Terms-of-Reference.docx",
        title: "Test Document",
        server_context: server_context
      )

      expect(response).to be_a(MCP::Tool::Response)
      expect(response.content).to be_an(Array)
      expect(response.content.first[:type]).to eq("text")
      expect(response.content.first[:text]).to include("Test Document")
    end
  end
end
