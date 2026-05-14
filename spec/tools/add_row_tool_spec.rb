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

    it "returns not found error response when the table does not exist" do
      response = AddRowTool.call(
        table_id: "nonexistent",
        values: { "Key" => "X" },
        server_context: server_context
      )
      expect(response).to be_a(MCP::Tool::Response)
      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("not_found")
    end

    it "returns not found error response when accessing a table in another organization" do
      other_context = {
        user_id: user.id,
        organization_id: organizations(:hc).id
      }

      response = AddRowTool.call(
        table_id: table.id,
        values: { "Key" => "X" },
        server_context: other_context
      )
      expect(response).to be_a(MCP::Tool::Response)
      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("not_found")
    end

    it "returns a structured value_formula error when a cell value formula is invalid" do
      response = AddRowTool.call(
        table_id: table.id,
        values: { "Key" => "InvalidFormula(" },
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:error_type]).to eq("invalid_value_formula")
      expect(content[:field]).to eq("Key")
      expect(content[:formula]).to eq("InvalidFormula(")
      expect(content[:examples]).to be_an(Array).and(be_present)
      expect(content[:documentation_url]).to include("docs.fundamento.it")
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(Formula::ActionExecutor).to receive(:new).and_raise(RuntimeError, "Something went wrong")
        response = AddRowTool.call(
          table_id: table.id,
          values: { "Key" => "X" },
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
