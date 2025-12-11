require "rails_helper"

RSpec.describe CreateDocumentTool, type: :model do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "happy case - creates document with title and markdown" do
      it "creates a new document and returns its details" do
        sample_blocks = [{ "id" => "1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Hello World" }] }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Hello World")

        expect {
          @response = CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: nil,
            title: "New Document",
            markdown: "# Hello World\n\nThis is a test.",
            server_context: server_context
          )
        }.to change(Document, :count).by(1)
         .and change(Version, :count).by(1)

        expect(@response).to be_a(MCP::Tool::Response)
        expect(@response.content).to be_an(Array)
        expect(@response.content.first[:type]).to eq("text")

        json_response = JSON.parse(@response.content.first[:text])
        expect(json_response["npi"]).to be_present
        expect(json_response["title"]).to eq("New Document")
        expect(json_response["content"]).to eq("# Hello World")
        expect(json_response["tags"]).to eq([])

        # Verify document is in hierarchy
        space.reload
        created_doc = Document.find_by(npi: json_response["npi"])
        expect(space.hierarchy).to include(
          hash_including("id" => created_doc.id)
        )
      end
    end

    context "creates a document under a parent" do
      let(:parent_doc) do
        space.documents.create!(
          title: "Parent Document",
          organization: organization
        )
      end

      before do
        # Add parent to hierarchy
        hierarchy_node = space.create_hierarchy_node(parent_doc.id)
        space.hierarchy.append(hierarchy_node)
        space.save!
      end

      it "creates a nested document under the parent" do
        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Child")

        expect {
          @response = CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: parent_doc.npi,
            title: "Child Document",
            markdown: "# Child",
            server_context: server_context
          )
        }.to change(Document, :count).by(1)

        json_response = JSON.parse(@response.content.first[:text])
        created_doc = Document.find_by(npi: json_response["npi"])

        # Verify child is nested under parent in hierarchy
        space.reload
        parent_node = space.hierarchy.find { |node| node["id"] == parent_doc.id }
        expect(parent_node).to be_present
        expect(parent_node["children"]).to include(
          hash_including("id" => created_doc.id)
        )
      end
    end

    context "creates a document with tags from frontmatter" do
      it "creates a document and associates tags from frontmatter" do
        markdown_with_frontmatter = <<~MARKDOWN
          ---
          tags:
            - rok/2024/05
            - osobiste/refleksje
            - osobiste/rozwój
          ---

          # Hello World

          This is a test document with tags from frontmatter.
        MARKDOWN

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Hello World\n\nThis is a test document with tags from frontmatter.")

        expect {
          @response = CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: nil,
            title: "Document with Tags",
            markdown: markdown_with_frontmatter,
            server_context: server_context
          )
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(3)
         .and change(ObjectTag, :count).by(3)

        json_response = JSON.parse(@response.content.first[:text])
        created_doc = Document.find_by(npi: json_response["npi"])

        expect(created_doc.tags.count).to eq(3)
        expect(created_doc.tags.pluck(:name)).to contain_exactly(
          "rok/2024/05",
          "osobiste/refleksje",
          "osobiste/rozwój"
        )

        expect(json_response["tags"]).to contain_exactly(
          "#rok/2024/05",
          "#osobiste/refleksje",
          "#osobiste/rozwój"
        )
      end
    end

    context "reuses existing tags when creating document" do
      it "reuses existing tags instead of creating duplicates" do
        # Create existing tag
        existing_tag = space.tags.create!(
          name: "existing/tag",
          organization: organization
        )

        markdown_with_frontmatter = <<~MARKDOWN
          ---
          tags:
            - existing/tag
            - new/tag
          ---

          # Content
        MARKDOWN

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Content")

        expect {
          @response = CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: nil,
            title: "Document Reusing Tags",
            markdown: markdown_with_frontmatter,
            server_context: server_context
          )
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(1) # Only 1 new tag created

        json_response = JSON.parse(@response.content.first[:text])
        created_doc = Document.find_by(npi: json_response["npi"])

        expect(created_doc.tags.count).to eq(2)
        expect(created_doc.tags).to include(existing_tag)
        expect(json_response["tags"]).to contain_exactly("#existing/tag", "#new/tag")
      end
    end

    context "with invalid space npi" do
      it "raises RecordNotFound error" do
        expect {
          CreateDocumentTool.call(
            space_npi: "invalid-npi",
            parent_document_npi: nil,
            title: "Test Document",
            markdown: "# Content",
            server_context: server_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "with invalid parent document npi" do
      it "raises RecordNotFound error" do
        expect {
          CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: "invalid-parent-npi",
            title: "Test Document",
            markdown: "# Content",
            server_context: server_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "user has no authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_user) { users(:maria) }
      let(:unauthorized_context) do
        {
          user_id: other_user.id,
          organization_id: other_org.id
        }
      end

      it "raises RecordNotFound when accessing space from different organization" do
        expect {
          CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: nil,
            title: "Unauthorized Document",
            markdown: "# Content",
            server_context: unauthorized_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when BlocknoteConverterService fails" do
      it "raises BlocknoteConversionError" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
          .and_raise(BlocknoteConversionError.new("Conversion failed"))

        expect {
          CreateDocumentTool.call(
            space_npi: space.npi,
            parent_document_npi: nil,
            title: "Test Document",
            markdown: "# Content",
            server_context: server_context
          )
        }.to raise_error(BlocknoteConversionError, "Conversion failed")
      end
    end
  end
end
