require "rails_helper"

RSpec.describe AddOrUpdateRowsTool, type: :model do
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
    it "adds a new row when no row matches the condition" do
      original_count = table.rows.count

      response = AddOrUpdateRowsTool.call(
        table_id: table.id,
        condition_formula: 'Equals(CurrentRow("Key"), "BRAND_NEW")',
        values: { "Key" => "BRAND_NEW", "Name" => "Created via upsert" },
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:added_row_ids].size).to eq(1)
      expect(content[:updated_row_ids]).to eq([])
      expect(table.reload.rows.count).to eq(original_count + 1)
    end

    it "updates matching rows without adding when one matches" do
      original_count = table.rows.count

      response = AddOrUpdateRowsTool.call(
        table_id: table.id,
        condition_formula: 'Equals(CurrentRow("Key"), "JIRA")',
        values: { "Description" => "Upserted" },
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:added_row_ids]).to eq([])
      expect(content[:updated_row_ids].size).to eq(1)
      expect(table.reload.rows.count).to eq(original_count)
    end

    it "returns not found error response when the table does not exist" do
      response = AddOrUpdateRowsTool.call(
        table_id: "nonexistent",
        condition_formula: "",
        values: { "Key" => "X" },
        server_context: server_context
      )
      expect(response).to be_a(MCP::Tool::Response)
      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("not_found")
    end

    it "returns a structured condition_formula error when the condition formula is invalid" do
      response = AddOrUpdateRowsTool.call(
        table_id: table.id,
        condition_formula: "InvalidFormula(",
        values: { "Key" => "X" },
        server_context: server_context
      )

      content = response.structured_content
      expect(content[:error_type]).to eq("invalid_condition_formula")
      expect(content[:field]).to eq("condition_formula")
      expect(content[:formula]).to eq("InvalidFormula(")
      expect(content[:examples]).to be_an(Array).and(be_present)
      expect(content[:documentation_url]).to include("docs.fundamento.it")
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(Formula::ActionExecutor).to receive(:new).and_raise(RuntimeError, "Something went wrong")
        response = AddOrUpdateRowsTool.call(
          table_id: table.id,
          condition_formula: "",
          values: { "Key" => "X" },
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
