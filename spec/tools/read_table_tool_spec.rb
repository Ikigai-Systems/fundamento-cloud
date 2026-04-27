require "rails_helper"

RSpec.describe ReadTableTool, type: :model do
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
    it "returns columns and rows for a table" do
      response = ReadTableTool.call(
        table_id: table.id,
        server_context: server_context
      )

      expect(response).to be_a(MCP::Tool::Response)
      content = response.structured_content
      expect(content[:id]).to eq(table.id)
      expect(content[:name]).to eq(table.name)
      expect(content[:columns].map { |c| c[:name] }).to eq(["Key", "Name", "Description", "Value"])
      expect(content[:rows]).to be_an(Array)
      expect(content[:rows].size).to be > 0
      expect(content[:rows].first["id"]).to be_present
    end

    it "honors limit and reports has_more=true" do
      response = ReadTableTool.call(
        table_id: table.id,
        limit: 1,
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:returned]).to eq(1)
      expect(content[:offset]).to eq(0)
      expect(content[:row_count]).to be > 1
      expect(content[:has_more]).to be true
    end

    it "honors offset and reports has_more=false at the end" do
      total = table.rows.count
      response = ReadTableTool.call(
        table_id: table.id,
        offset: total - 1,
        limit: 10,
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:returned]).to eq(1)
      expect(content[:offset]).to eq(total - 1)
      expect(content[:has_more]).to be false
    end

    it "returns empty rows when offset is past the end" do
      response = ReadTableTool.call(
        table_id: table.id,
        offset: 1000,
        server_context: server_context
      )

      expect(response.structured_content[:rows]).to eq([])
      expect(response.structured_content[:has_more]).to be false
    end

    it "resolves table by name" do
      response = ReadTableTool.call(
        table_id: table.name,
        server_context: server_context
      )

      expect(response.structured_content[:id]).to eq(table.id)
    end

    it "raises RecordNotFound when table is missing" do
      expect {
        ReadTableTool.call(
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
        ReadTableTool.call(
          table_id: table.id,
          server_context: other_context
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
