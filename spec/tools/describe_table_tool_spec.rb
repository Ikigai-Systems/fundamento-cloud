require "rails_helper"

RSpec.describe DescribeTableTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:table) { tables_tables(:projects) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    it "returns table schema by id" do
      response = DescribeTableTool.call(
        table_id: table.id,
        server_context: server_context
      )

      expect(response).to be_a(MCP::Tool::Response)
      content = response.structured_content
      expect(content[:id]).to eq(table.id)
      expect(content[:name]).to eq(table.name)
      expect(content[:space_id]).to eq(space.id)
      expect(content[:row_count]).to eq(table.rows.count)
    end

    it "returns columns in order with kind and id" do
      response = DescribeTableTool.call(
        table_id: table.id,
        server_context: server_context
      )

      columns = response.structured_content[:columns]
      expect(columns.map { |c| c[:name] }).to eq(["Key", "Name", "Description", "Value"])
      expect(columns.first[:kind]).to eq("string")
      expect(columns.first[:id]).to be_present
    end

    it "resolves table by name when unambiguous" do
      response = DescribeTableTool.call(
        table_id: table.name,
        server_context: server_context
      )

      expect(response.structured_content[:id]).to eq(table.id)
    end

    it "resolves table by name within a given space" do
      response = DescribeTableTool.call(
        table_id: table.name,
        space_id: space.id,
        server_context: server_context
      )

      expect(response.structured_content[:id]).to eq(table.id)
    end

    it "raises RecordNotFound when table does not exist" do
      expect {
        DescribeTableTool.call(
          table_id: "nonexistent",
          server_context: server_context
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "raises when accessing a table in another organization" do
      other_context = {
        user_id: user.id,
        organization_id: organizations(:hc).id
      }

      expect {
        DescribeTableTool.call(
          table_id: table.id,
          server_context: other_context
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
