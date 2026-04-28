require "rails_helper"

RSpec.describe UpdateRowsTool, type: :model do
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
    it "updates rows matching the condition" do
      response = UpdateRowsTool.call(
        table_id: table.id,
        condition_formula: 'Equals(CurrentRow("Key"), "JIRA")',
        values: { "Description" => "Updated by MCP" },
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:count]).to eq(1)
      expect(content[:updated_row_ids]).to be_an(Array)
      expect(content[:updated_row_ids].size).to eq(1)

      jira_row = table.reload.rows.find { |r|
        r.cells.find_by(column: table.columns.find_by(name: "Key")).value == "JIRA"
      }
      expect(jira_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("Updated by MCP")
    end

    it "updates no rows when condition matches nothing" do
      response = UpdateRowsTool.call(
        table_id: table.id,
        condition_formula: 'Equals(CurrentRow("Key"), "NOPE")',
        values: { "Description" => "should not apply" },
        server_context: server_context
      )

      expect(response.structured_content[:count]).to eq(0)
      expect(response.structured_content[:updated_row_ids]).to eq([])
    end

    it "updates all rows when condition is empty" do
      response = UpdateRowsTool.call(
        table_id: table.id,
        condition_formula: "",
        values: { "Description" => "all" },
        server_context: server_context
      )

      expect(response.structured_content[:count]).to eq(table.rows.count)
    end

    it "raises RecordNotFound when the table does not exist" do
      expect {
        UpdateRowsTool.call(
          table_id: "nonexistent",
          condition_formula: "",
          values: { "Description" => "X" },
          server_context: server_context
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "returns an error in structured_content when the condition formula is invalid" do
      response = UpdateRowsTool.call(
        table_id: table.id,
        condition_formula: "InvalidFormula(",
        values: { "Description" => "X" },
        server_context: server_context
      )

      expect(response).to be_a(MCP::Tool::Response)
      expect(response.structured_content[:error]).to be_present
      expect(response.structured_content[:error]).to include("Unable to update rows")
    end
  end
end
