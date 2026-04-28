require "rails_helper"

RSpec.describe AddRowTool, type: :model do
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
    it "adds a row and returns the new row's values" do
      expect {
        @response = AddRowTool.call(
          table_id: table.id,
          values: {
            "Key" => "MCP",
            "Name" => "From MCP",
            "Description" => "Added via MCP",
            "Value" => "42"
          },
          server_context: server_context
        )
      }.to change { table.reload.rows.count }.by(1)

      content = @response.structured_content
      expect(content[:row_id]).to be_present
      expect(content[:table_id]).to eq(table.id)
      expect(content[:values]["Key"]).to eq("MCP")
      expect(content[:values]["Name"]).to eq("From MCP")
    end

    it "resolves table by name" do
      expect {
        AddRowTool.call(
          table_id: table.name,
          values: { "Key" => "BY_NAME" },
          server_context: server_context
        )
      }.to change { table.reload.rows.count }.by(1)
    end

    it "raises RecordNotFound when the table does not exist" do
      expect {
        AddRowTool.call(
          table_id: "nonexistent",
          values: { "Key" => "X" },
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
        AddRowTool.call(
          table_id: table.id,
          values: { "Key" => "X" },
          server_context: other_context
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "returns an error in structured_content when a cell value formula is invalid" do
      response = AddRowTool.call(
        table_id: table.id,
        values: { "Key" => "InvalidFormula(" },
        server_context: server_context
      )

      expect(response).to be_a(MCP::Tool::Response)
      expect(response.structured_content[:error]).to be_present
      expect(response.structured_content[:error]).to include("Unable to add row")
    end
  end
end
