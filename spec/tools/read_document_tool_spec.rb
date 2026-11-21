require "rails_helper"

RSpec.describe ReadDocumentTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :object_contents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "happy case - user has access to document" do
      let(:document) { documents(:one) }

      it "returns the icon separately from the title" do
        document.update!(title: "🔥 Hot Topic")

        response = ReadDocumentTool.call(id: document.id, server_context: server_context)

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["title"]).to eq("Hot Topic")
        expect(json_response["icon"]).to eq("type" => "emoji", "value" => "🔥")
      end

      it "returns the color by name, or null when there is none" do
        response = ReadDocumentTool.call(id: document.id, server_context: server_context)
        expect(JSON.parse(response.content.first[:text])).to include("color" => nil)

        document.update!(color: "blue")
        response = ReadDocumentTool.call(id: document.id, server_context: server_context)
        expect(JSON.parse(response.content.first[:text])["color"]).to eq("blue")
      end

      it "marks a block that has comments with its id, and no other, when block_ids is off" do
        blocks = [
          {"id" => "commented-1", "type" => "paragraph", "content" => [{"type" => "text", "text" => "Commented"}]},
          {"id" => "plain-1", "type" => "paragraph", "content" => [{"type" => "text", "text" => "Plain"}]}
        ]
        document.versions.create!(content_blocks: blocks, created_by: user)
        document.comments.create!(
          organization: organization,
          organization_membership: organization_memberships(:om_is_pawel),
          content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "A comment"}]}],
          anchor_block_id: "commented-1"
        )

        read = ->(**options) { JSON.parse(ReadDocumentTool.call(id: document.id, source: "saved_version", server_context: server_context, **options).content.first[:text])["content"] }

        expect(read.call(block_ids: false)).to include("Commented ^commented-1")
        expect(read.call(block_ids: false)).not_to include("^plain-1")
        expect(read.call).to include("^commented-1", "^plain-1")
      end

      it "marks every block with its id by default" do
        text = JSON.parse(ReadDocumentTool.call(id: document.id, server_context: server_context).content.first[:text])["content"]

        expect(text.scan(/ \^[\w-]+$/).size).to be >= 3
      end

      describe "attachments" do
        it "lists the ones the content points at, for Read Attachment to open" do
          attachment = Attachment.create!(organization: organization, parent: document, filename: "shot.png", mime_type: "image/png")
          attachment.file.attach(io: StringIO.new("12345"), filename: "shot.png", content_type: "image/png")
          document.versions.create!(content_blocks: [
            {"id" => "img-1", "type" => "image", "props" => {"url" => "attachment:#{attachment.id}", "name" => "shot.png"}},
          ], created_by: user)

          result = JSON.parse(ReadDocumentTool.call(id: document.id, source: "saved_version", server_context: server_context).content.first[:text])

          expect(result["attachments"]).to eq([
            {"id" => attachment.id, "name" => "shot.png", "mime_type" => "image/png", "size" => 5, "block_id" => "img-1"},
          ])
          expect(result["content"]).to include("attachment:#{attachment.id}")
        end

        it "lists none for a document without any" do
          result = JSON.parse(ReadDocumentTool.call(id: document.id, server_context: server_context).content.first[:text])

          expect(result["attachments"]).to eq([])
        end
      end

      describe "live content and saved versions" do
        let(:saved) { [{"id" => "saved-1", "type" => "paragraph", "content" => [{"type" => "text", "text" => "Saved text"}]}] }

        before do
          document.versions.create!(content_blocks: saved, created_by: user)
        end

        def read_as(context, **options)
          JSON.parse(ReadDocumentTool.call(id: document.id, server_context: context, **options).content.first[:text])
        end

        it "gives a user who can edit the live content, which is ahead of the last saved version" do
          result = read_as(server_context)

          expect(result["source"]).to eq("live")
          expect(result["content"]).to include("Welcome in your space!")
          expect(result["content"]).not_to include("Saved text")
        end

        it "gives the saved version to a user who can edit, when asked for it" do
          result = read_as(server_context, source: "saved_version")

          expect(result["source"]).to eq("saved_version")
          expect(result["content"]).to include("Saved text")
        end

        it "gives a read-only user the saved version, even when asked for the live one" do
          document.space.update!(access_mode: :restricted)
          reader = {user_id: users(:stefan).id, organization_id: organization.id}

          result = read_as(reader, source: "live")

          expect(result["source"]).to eq("saved_version")
          expect(result["content"]).to include("Saved text")
          expect(result["content"]).not_to include("Welcome in your space!")
        end

        it "reads a draft live for everyone, as there is nothing saved" do
          document.versions.destroy_all
          document.space.update!(access_mode: :restricted)

          result = read_as({user_id: users(:stefan).id, organization_id: organization.id})

          expect(result["source"]).to eq("live")
          expect(result["content"]).to include("Welcome in your space!")
        end

        it "returns the sync_version, which moves when the content is written" do
          before = read_as(server_context)["sync_version"]
          document.content.update!(sync: document.content.sync + "x".b)

          expect(read_as(server_context)["sync_version"]).to eq(before + 1)
        end
      end

      it "returns document content as Markdown" do
        response = ReadDocumentTool.call(
          id: document.id,
          block_ids: false,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.content).to be_an(Array)
        expect(response.content.first[:type]).to eq("text")

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["id"]).to eq(document.id)
        expect(json_response["title"]).to eq(document.title)
        expect(json_response["content"]).to eq(
          File.read("app/templates/space.markdown"))
      end
    end

    context "frontmatter option" do
      let(:document) { documents(:one) }

      before do
        document.assign_title_and_icon(title: "Plan: Q4", icon: "🔥")
        document.assign_color("indigo")
        document.save!
        TagsService.new(object: document, organization: organization).update_tags(["blog"])
      end

      def read(**options)
        response = ReadDocumentTool.call(id: document.id, block_ids: false, server_context: server_context, **options)
        JSON.parse(response.content.first[:text])
      end

      it "default content has no frontmatter" do
        expect(read["content"]).to eq(File.read("app/templates/space.markdown"))
        expect(read(frontmatter: false)["content"]).to eq(File.read("app/templates/space.markdown"))
      end

      it "differs from the default response only by the prefix on content, even with <, > and &" do
        document.assign_title_and_icon(title: "<b>&</b>")
        document.save!
        plain = ReadDocumentTool.call(id: document.id, server_context: server_context).content.first[:text]
        prefixed = ReadDocumentTool.call(id: document.id, server_context: server_context, frontmatter: true).content.first[:text]
        prefix = document.reload.to_frontmatter

        expect(prefixed).to include("<b>&</b>")
        expect(prefixed.sub(JSON.generate(prefix)[1..-2], "")).to eq(plain)
      end

      it "frontmatter: true prefixes content, structured fields unchanged" do
        plain = read
        with_frontmatter = read(frontmatter: true)

        expect(with_frontmatter.except("content")).to eq(plain.except("content"))
        expect(with_frontmatter["content"]).to eq(
          "---\ntitle: 'Plan: Q4'\ntags:\n- blog\nfundamento/icon: \"\\U0001F525\"\nfundamento/color: indigo\n---\n\n" + plain["content"]
        )
      end
    end

    context "document not found" do
      it "returns not found error response" do
        response = ReadDocumentTool.call(
          id: "nonexistent",
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "user has no authorization to document" do
      let(:unauthorized_context) do
        {
          user_id: users(:maria).id,
          organization_id: organization.id
        }
      end

      it "returns not found error response when document belongs to different organization" do
        response = ReadDocumentTool.call(
          id: documents(:one).id,
          server_context: unauthorized_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(DocumentBlueprint).to receive(:render).and_raise(RuntimeError, "Something went wrong")
        response = ReadDocumentTool.call(
          id: documents(:one).id,
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
