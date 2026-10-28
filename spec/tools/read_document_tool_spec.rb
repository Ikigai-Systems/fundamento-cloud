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

      it "returns document content as Markdown" do
        response = ReadDocumentTool.call(
          id: document.id,
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
        response = ReadDocumentTool.call(id: document.id, server_context: server_context, **options)
        JSON.parse(response.content.first[:text])
      end

      it "default content has no frontmatter" do
        expect(read["content"]).to eq(File.read("app/templates/space.markdown"))
        expect(read(frontmatter: false)["content"]).to eq(File.read("app/templates/space.markdown"))
      end

      it "frontmatter: true prefixes content, structured fields unchanged" do
        plain = read
        with_frontmatter = read(frontmatter: true)

        expect(with_frontmatter.except("content")).to eq(plain.except("content"))
        expect(with_frontmatter["content"]).to eq(
          "---\ntitle: 'Plan: Q4'\ntags:\n- blog\nfundamento/icon: \"🔥\"\nfundamento/color: indigo\n---\n\n" + plain["content"]
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
