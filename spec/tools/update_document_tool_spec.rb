require "rails_helper"

RSpec.describe UpdateDocumentTool, type: :model do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:document) { documents(:one) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "happy case - updates document with markdown content" do
      it "updates document and creates new version" do
        markdown_content = file_fixture("documents/updated_content.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Updated Content" }] }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return(markdown_content)

        expect {
          @response = UpdateDocumentTool.call(
            id: document.id,
            markdown: markdown_content,
            server_context: server_context
          )
        }.to change(Version, :count).by(1)

        expect(@response).to be_a(MCP::Tool::Response)
        expect(@response.content).to be_an(Array)
        expect(@response.content.first[:type]).to eq("text")

        json_response = JSON.parse(@response.content.first[:text])
        expect(json_response["id"]).to eq(document.id)
        expect(json_response["title"]).to eq(document.title)
        expect(json_response["content"]).to eq(markdown_content)

        # Verify new version was created
        document.reload
        expect(document.versions.count).to eq(1)
        expect(document.versions.last.content_blocks).to eq(sample_blocks)
      end
    end

    context "updates document with tags from frontmatter" do
      it "updates document and associates tags from frontmatter" do
        markdown_with_frontmatter = file_fixture("documents/updated_with_tags.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated Content")

        expect {
          @response = UpdateDocumentTool.call(
            id: document.id,
            markdown: markdown_with_frontmatter,
            server_context: server_context
          )
        }.to change(Tag, :count).by(2)
         .and change(ObjectTag, :count).by(2)

        json_response = JSON.parse(@response.content.first[:text])
        document.reload

        expect(document.tags.count).to eq(2)
        expect(document.tags.pluck(:name)).to contain_exactly("updated/tag1", "updated/tag2")
        expect(json_response["tags"]).to contain_exactly("#updated/tag1", "#updated/tag2")

        # Verify markdown content was processed without frontmatter
        expect(BlocknoteConverterService).to have_received(:markdown_to_blocks) do |markdown|
          expect(markdown).not_to include("---")
          expect(markdown).not_to include("tags:")
          expect(markdown).to include("# Updated Content")
        end
      end
    end

    context "replaces existing tags when updating with new frontmatter tags" do
      it "removes old tags and adds new tags from frontmatter" do
        # Create initial tags
        initial_tag = space.tags.create!(name: "initial/tag", organization: organization)
        document.object_tags.create!(tag: initial_tag, organization: organization)

        markdown_with_frontmatter = file_fixture("documents/replace_tags.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated Content")

        @response = UpdateDocumentTool.call(
          id: document.id,
          markdown: markdown_with_frontmatter,
          server_context: server_context
        )

        document.reload
        expect(document.tags.count).to eq(2)
        expect(document.tags).not_to include(initial_tag)
        expect(document.tags.pluck(:name)).to contain_exactly("new/tag1", "new/tag2")
      end
    end

    context "sets created_by on new version" do
      it "associates the current user with the new version" do
        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated")

        UpdateDocumentTool.call(
          id: document.id,
          markdown: "# Updated",
          server_context: server_context
        )

        document.reload
        expect(document.versions.last.created_by).to eq(user)
      end
    end

    context "updates document sync field" do
      it "updates the sync field with new Y.js sync data" do
        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = "new_yjs_sync_data"

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated")

        UpdateDocumentTool.call(
          id: document.id,
          markdown: "# Updated Content",
          server_context: server_context
        )

        document.reload
        expect(document.sync).to eq(sample_sync)
      end
    end

    context "with invalid document id" do
      it "raises RecordNotFound error" do
        expect {
          UpdateDocumentTool.call(
            id: "invalid-id",
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

      it "raises RecordNotFound when accessing document from different organization" do
        expect {
          UpdateDocumentTool.call(
            id: document.id,
            markdown: "# Updated Content",
            server_context: unauthorized_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when BlocknoteConverterService fails" do
      it "raises ConversionError" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
          .and_raise(BlocknoteConverterService::ConversionError.new("Conversion failed"))

        expect {
          UpdateDocumentTool.call(
            id: document.id,
            markdown: "# Content",
            server_context: server_context
          )
        }.to raise_error(BlocknoteConverterService::ConversionError, "Conversion failed")
      end
    end

    context "creates multiple versions over time" do
      it "accumulates versions with each update" do
        sample_blocks1 = [{ "id" => "1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "First update" }] }]
        sample_blocks2 = [{ "id" => "2", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Second update" }] }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks1, sample_blocks2)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("First update", "Second update")

        expect {
          UpdateDocumentTool.call(
            id: document.id,
            markdown: "# First update",
            server_context: server_context
          )
        }.to change(Version, :count).by(1)

        expect {
          UpdateDocumentTool.call(
            id: document.id,
            markdown: "# Second update",
            server_context: server_context
          )
        }.to change(Version, :count).by(1)

        document.reload
        expect(document.versions.count).to eq(2)
        expect(document.versions.first.content_blocks).to eq(sample_blocks1)
        expect(document.versions.last.content_blocks).to eq(sample_blocks2)
      end
    end
  end
end
