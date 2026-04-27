require "rails_helper"

RSpec.describe ListTablesTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

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
    it "lists all non-archived tables in the organization" do
      response = ListTablesTool.call(server_context: server_context)

      expect(response).to be_a(MCP::Tool::Response)
      tables = response.structured_content[:tables]
      expect(tables).to be_an(Array)
      expect(tables.map { |t| t[:name] }).to include("Projects", "Orders", "Users", "Users Tracker")
    end

    it "includes counts and space metadata" do
      response = ListTablesTool.call(server_context: server_context)

      projects = response.structured_content[:tables].find { |t| t[:name] == "Projects" }
      expect(projects[:id]).to eq(tables_tables(:projects).id)
      expect(projects[:space_id]).to eq(space.id)
      expect(projects[:space_name]).to eq(space.name)
      expect(projects[:column_count]).to be > 0
      expect(projects[:row_count]).to be >= 0
      expect(projects[:archived]).to be false
    end

    it "filters by space_id when provided" do
      response = ListTablesTool.call(
        server_context: server_context,
        space_id: space.id
      )

      space_ids = response.structured_content[:tables].map { |t| t[:space_id] }.uniq
      expect(space_ids).to eq([space.id])
    end

    it "raises when space does not exist" do
      expect {
        ListTablesTool.call(
          server_context: server_context,
          space_id: "nonexistent"
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "excludes tables from organizations the user does not belong to" do
      other_context = {
        user_id: user.id,
        organization_id: organizations(:hc).id
      }

      response = ListTablesTool.call(server_context: other_context)
      table_ids = response.structured_content[:tables].map { |t| t[:id] }
      expect(table_ids).not_to include(tables_tables(:projects).id)
    end
  end
end
