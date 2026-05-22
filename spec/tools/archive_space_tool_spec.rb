require "rails_helper"

RSpec.describe ArchiveSpaceTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces

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
    context "when called by a manager" do
      before do
        organization_memberships(:om_is_pawel).update!(role: :manager)
      end

      it "archives the space and returns a success message" do
        response = ArchiveSpaceTool.call(space_id: space.id, server_context: server_context)

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be false
        expect(response.content.first[:text]).to include("has been archived")
        expect(space.reload.archived).to eq(true)
      end
    end

    context "when called by a non-manager" do
      before do
        organization_memberships(:om_is_pawel).update!(role: :member)
      end

      it "returns an authorization error" do
        response = ArchiveSpaceTool.call(space_id: space.id, server_context: server_context)

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("unauthorized")
      end
    end
  end
end
