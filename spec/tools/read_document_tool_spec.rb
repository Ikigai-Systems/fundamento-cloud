require "rails_helper"

RSpec.describe ReadDocumentTool, type: :model do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :documents

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

      it "returns document content as Markdown" do
        response = ReadDocumentTool.call(
          npi: document.npi,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.content).to be_an(Array)
        expect(response.content.first[:type]).to eq("text")

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["npi"]).to eq(document.npi)
        expect(json_response["title"]).to eq(document.title)
        expect(json_response["content"]).to eq(
          File.read("app/templates/space.markdown"))
      end
    end

    context "document not found" do
      it "raises RecordNotFound error" do
        expect {
          ReadDocumentTool.call(
            npi: "nonexistent",
            server_context: server_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "user has no authorization to document" do
      let(:unauthorized_context) do
        {
          user_id: users(:maria).id,
          organization_id: organization.id
        }
      end

      it "raises RecordNotFound error when document belongs to different organization" do
        expect {
          ReadDocumentTool.call(
            npi: documents(:one).npi,
            server_context: unauthorized_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end