require "rails_helper"

RSpec.describe UpdateDocumentTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :object_contents

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
    # The real converter, so this proves the whole loop: read with markers, edit, update.
    context "keeping block ids" do
      let(:pundit_user) { PolicyUserContext.new(user, organization) }
      let(:note) do
        DocumentService.new(pundit_user: pundit_user)
          .create!(space_id: space.id, title: "Ids", markdown: "# Title\n\nFirst\n\nSecond\n")
      end

      def block_ids(document)
        BlocknoteBlocks.block_ids(document.reload.versions.last.content_blocks)
      end

      def read_with_ids(document)
        response = ReadDocumentTool.call(id: document.id, block_ids: true, server_context: server_context)
        JSON.parse(response.content.first[:text])["content"]
      end

      it "keeps the id of every block whose marker is kept" do
        ids_before = block_ids(note)

        UpdateDocumentTool.call(
          id: note.id,
          markdown: read_with_ids(note).sub("First", "First, edited"),
          server_context: server_context
        )

        expect(block_ids(note)).to eq(ids_before)
        expect(note.versions.last.content_blocks.second["content"].first["text"]).to eq("First, edited")
      end

      it "gives a new block a new id and drops the block whose marker is gone" do
        title_id, first_id, second_id = block_ids(note)
        markdown = read_with_ids(note).lines.reject { |line| line.include?("First") }.join + "\nBrand new\n"

        UpdateDocumentTool.call(id: note.id, markdown: markdown, server_context: server_context)

        ids = block_ids(note)
        expect(ids).to include(title_id, second_id)
        expect(ids).not_to include(first_id)
        expect(ids.size).to eq(3)
      end

      it "leaves a marker of an id the document does not have as text" do
        UpdateDocumentTool.call(id: note.id, markdown: "Look at ^elsewhere", server_context: server_context)

        expect(note.reload.versions.last.content_blocks.first["content"].first["text"]).to eq("Look at ^elsewhere")
      end

      it "keeps no ids when the markdown was read without block_ids" do
        ids_before = block_ids(note)
        response = ReadDocumentTool.call(id: note.id, server_context: server_context)
        markdown = JSON.parse(response.content.first[:text])["content"]

        expect(markdown).not_to include("^")

        UpdateDocumentTool.call(id: note.id, markdown: markdown, server_context: server_context)

        expect(block_ids(note) & ids_before).to be_empty
      end

      it "keeps the id of a block that has a comment even when it was read without block_ids" do
        title_id, first_id, second_id = block_ids(note)
        note.comments.create!(
          organization: organization,
          organization_membership: organization_memberships(:om_is_pawel),
          content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "About the first one"}]}],
          anchor_block_id: first_id
        )
        response = ReadDocumentTool.call(id: note.id, server_context: server_context)
        markdown = JSON.parse(response.content.first[:text])["content"]

        expect(markdown.scan("^").size).to eq(1)

        UpdateDocumentTool.call(id: note.id, markdown: markdown.sub("First", "First, edited"), server_context: server_context)

        ids = block_ids(note)
        expect(ids).to include(first_id)
        expect(ids & [title_id, second_id]).to be_empty
        expect(note.versions.last.content_blocks.second["content"].first["text"]).to eq("First, edited")
      end
    end

    # What an open editor sees: the real converter, and the stored state as the editor holds it.
    context "while the document is open in an editor" do
      include ActionCable::TestHelper

      let(:pundit_user) { PolicyUserContext.new(user, organization) }
      let(:note) do
        DocumentService.new(pundit_user: pundit_user)
          .create!(space_id: space.id, title: "Open", markdown: "# Title\n\nFirst\n\nSecond\n")
      end

      def texts(blocks)
        blocks.map { |block| block["content"]&.first&.dig("text") }
      end

      # The message as a browser receives it: a sync update, base64, the payload after two
      # leading varints (message type and sync type).
      def update_bytes(data)
        decoder = Y::Lib0::Decoding.create_decoder(Y::Lib0::Decoding.decode_base64_to_uint8_array(data[:update]))
        Y::Lib0::Decoding.read_var_uint(decoder)
        Y::Lib0::Decoding.read_var_uint(decoder)
        Y::Lib0::Decoding.read_var_uint8_array(decoder).to_a
      end

      it "sends what changed to the editors, and it turns their copy into the new content" do
        editor = Y::Doc.new
        editor.sync(note.content.sync.unpack("C*"))
        sent = nil

        expect {
          UpdateDocumentTool.call(id: note.id, markdown: "# Title\n\nFirst, edited\n\nSecond\n", server_context: server_context)
        }.to have_broadcasted_to("document/#{note.id}").with { |data| sent = data }

        editor.sync(update_bytes(sent))

        expect(texts(BlocknoteConverterService.yjs_to_blocks(editor.diff.pack("C*")))).to eq(["Title", "First, edited", "Second"])
      end

      it "stores the same content the editors end up with" do
        UpdateDocumentTool.call(id: note.id, markdown: "# Title\n\nFirst, edited\n\nSecond\n", server_context: server_context)

        stored = BlocknoteConverterService.yjs_to_blocks(note.reload.content.sync)
        expect(texts(stored)).to eq(["Title", "First, edited", "Second"])
        expect(stored.map { |block| block["id"] }).to eq(note.versions.last.content_blocks.map { |block| block["id"] })
      end

      it "sends a change much smaller than the document when little changed" do
        sent = nil

        expect {
          UpdateDocumentTool.call(id: note.id, markdown: "# Title\n\nFirst, edited\n\nSecond\n", server_context: server_context)
        }.to have_broadcasted_to("document/#{note.id}").with { |data| sent = data }

        expect(update_bytes(sent).size).to be < note.reload.content.sync.bytesize
      end
    end

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
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs_update).and_return(["update", sample_sync])
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated")

        UpdateDocumentTool.call(
          id: document.id,
          markdown: "# Updated Content",
          server_context: server_context
        )

        document.reload
        expect(document.content.sync).to eq(sample_sync)
      end
    end

    context "renaming" do
      it "renames the document without creating a version" do
        expect {
          @response = UpdateDocumentTool.call(
            id: document.id,
            title: "Renamed",
            server_context: server_context
          )
        }.not_to change(Version, :count)

        expect(@response.error?).to be false
        expect(document.reload.title).to eq("Renamed")
        expect(JSON.parse(@response.content.first[:text])["title"]).to eq("Renamed")
      end

      it "renames and replaces content in one call" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([{ "id" => "1", "type" => "paragraph" }])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("sync")
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return("# Updated")

        expect {
          UpdateDocumentTool.call(
            id: document.id,
            title: "Renamed",
            markdown: "# Updated",
            server_context: server_context
          )
        }.to change(Version, :count).by(1)

        expect(document.reload.title).to eq("Renamed")
      end

      it "keeps the document's icon" do
        document.update!(title: "🔥 Hot Topic")

        UpdateDocumentTool.call(id: document.id, title: "Cold Topic", server_context: server_context)

        expect(document.reload.title).to eq("Cold Topic")
        expect(document.icon).to eq(Icon.emoji("🔥"))
      end

      it "stores a title with a leading emoji as given" do
        UpdateDocumentTool.call(id: document.id, title: "🔥 Hot Topic", server_context: server_context)

        expect(document.reload.title).to eq("🔥 Hot Topic")
        expect(document.icon).to be_nil
      end

      it "rejects a blank title" do
        response = UpdateDocumentTool.call(id: document.id, title: " ", server_context: server_context)

        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
        expect(document.reload.title).not_to be_blank
      end
    end

    context "icon" do
      it "sets the icon without creating a version and returns it" do
        expect {
          @response = UpdateDocumentTool.call(id: document.id, icon: "🔥", server_context: server_context)
        }.not_to change(Version, :count)

        expect(document.reload.icon).to eq(Icon.emoji("🔥"))
        expect(JSON.parse(@response.content.first[:text])["icon"]).to eq("type" => "emoji", "value" => "🔥")
      end

      it "removes the icon when given an empty string" do
        document.update!(title: "🔥 Hot Topic")

        UpdateDocumentTool.call(id: document.id, icon: "", server_context: server_context)

        expect(document.reload.icon).to be_nil
        expect(document.title).to eq("Hot Topic")
      end

      it "rejects an icon that isn't a single emoji" do
        response = UpdateDocumentTool.call(id: document.id, icon: "fire", server_context: server_context)

        expect(response.structured_content[:error]).to eq("invalid_input")
        expect(document.reload.icon).to be_nil
      end
    end

    context "color" do
      it "sets the color on its own without creating a version and returns its name" do
        expect {
          @response = UpdateDocumentTool.call(id: document.id, color: "Indigo", server_context: server_context)
        }.not_to change(Version, :count)

        expect(document.reload.color).to eq("indigo")
        expect(JSON.parse(@response.content.first[:text])["color"]).to eq("indigo")
      end

      it "removes the color when given an empty string" do
        document.update!(color: "lime")

        UpdateDocumentTool.call(id: document.id, color: "", server_context: server_context)

        expect(document.reload.color).to be_nil
      end

      it "rejects an unknown color and keeps the current one" do
        document.update!(color: "lime")

        response = UpdateDocumentTool.call(id: document.id, color: "chartreuse", server_context: server_context)

        expect(response.structured_content[:error]).to eq("invalid_input")
        expect(document.reload.color).to eq("lime")
      end
    end

    context "with neither title nor markdown" do
      it "returns an invalid input error" do
        response = UpdateDocumentTool.call(id: document.id, server_context: server_context)

        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end
    end

    context "with invalid document id" do
      it "returns not found error response" do
        response = UpdateDocumentTool.call(
          id: "invalid-id",
          markdown: "# Content",
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
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

      it "returns not found error response when accessing document from different organization" do
        response = UpdateDocumentTool.call(
          id: document.id,
          markdown: "# Updated Content",
          server_context: unauthorized_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "when BlocknoteConverterService fails" do
      it "returns an internal error response and reports to Sentry" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
          .and_raise(BlocknoteConverterService::ConversionError.new("Conversion failed"))
        expect(Sentry).to receive(:capture_exception).with(instance_of(BlocknoteConverterService::ConversionError), anything)

        response = UpdateDocumentTool.call(
          id: document.id,
          markdown: "# Content",
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
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
