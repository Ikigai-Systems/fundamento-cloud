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

    it "returns not found error response when table does not exist" do
      response = DescribeTableTool.call(
        table_id: "nonexistent",
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

      response = DescribeTableTool.call(
        table_id: table.id,
        server_context: other_context
      )
      expect(response).to be_a(MCP::Tool::Response)
      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("not_found")
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(Formula::TableLookup).to receive(:new).and_raise(RuntimeError, "Something went wrong")
        response = DescribeTableTool.call(
          table_id: table.id,
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
