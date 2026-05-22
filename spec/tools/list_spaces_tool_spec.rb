require "rails_helper"

RSpec.describe ListSpacesTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "happy case - user has access to spaces" do
      it "returns spaces in JSON format ordered by name" do
        response = ListSpacesTool.call(server_context: server_context)

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.content).to be_an(Array)
        expect(response.content.first[:type]).to eq("text")

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response).to be_an(Array)
        expect(json_response.length).to eq(2)
        expect(json_response.first["name"]).to eq("Default IS")
        expect(json_response.first["id"]).to eq(spaces(:is_default).id)
        expect(json_response.second["name"]).to eq("Stefan's Private Space")
        expect(json_response.second["id"]).to eq(spaces(:is_stefans).id)
      end

      it "includes documents from the space hierarchy" do
        doc = documents(:one)
        spaces(:is_default).update!(hierarchy: [{"id" => doc.id, "children" => []}])

        response = ListSpacesTool.call(server_context: server_context)

        json_response = JSON.parse(response.content.first[:text])
        default_space = json_response.find { |s| s["id"] == spaces(:is_default).id }
        expect(default_space["documents"]).to eq([{"npi" => doc.id, "title" => doc.title, "children" => []}])
      end
    end

    context "user has no authorization" do
      let(:server_context) do
        {
          user_id: user.id,
          organization_id: organizations(:another).id
        }
      end

      it "returns not found error response" do
        response = ListSpacesTool.call(server_context: server_context)
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        allow(SpaceBlueprint).to receive(:render).and_raise(RuntimeError, "Something went wrong")
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        response = ListSpacesTool.call(server_context: server_context)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
