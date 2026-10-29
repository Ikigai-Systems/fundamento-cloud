require "rails_helper"

RSpec.describe UpdateTableTool, type: :model do
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
    it "renames a table found by id" do
      response = UpdateTableTool.call(table_id: table.id, name: "Initiatives", server_context: server_context)

      expect(response.error?).to be false
      expect(response.structured_content).to include(id: table.id, name: "Initiatives", space_id: space.id)
      expect(table.reload.name).to eq("Initiatives")
    end

    it "renames a table found by name within a space" do
      UpdateTableTool.call(table_id: table.name, space_id: space.id, name: "Initiatives", server_context: server_context)

      expect(table.reload.name).to eq("Initiatives")
    end

    it "keeps the table's icon" do
      table.update!(name: "📊 Metrics")

      UpdateTableTool.call(table_id: table.id, name: "KPIs", server_context: server_context)

      expect(table.reload.name).to eq("KPIs")
      expect(table.icon).to eq(Icon.emoji("📊"))
    end

    it "sets the icon and returns it" do
      response = UpdateTableTool.call(table_id: table.id, icon: "📊", server_context: server_context)

      expect(response.structured_content[:icon]).to eq(type: "emoji", value: "📊")
      expect(table.reload.icon).to eq(Icon.emoji("📊"))
      expect(table.name).to eq("Projects")
    end

    it "removes the icon when given an empty string" do
      table.update!(name: "📊 Metrics")

      UpdateTableTool.call(table_id: table.id, icon: "", server_context: server_context)

      expect(table.reload.icon).to be_nil
    end

    it "rejects an icon that isn't a single emoji" do
      response = UpdateTableTool.call(table_id: table.id, icon: "chart", server_context: server_context)

      expect(response.structured_content[:error]).to eq("invalid_input")
    end

    it "accepts a color alone and returns its name" do
      response = UpdateTableTool.call(table_id: table.id, color: "Magenta", server_context: server_context)

      expect(response.error?).to be false
      expect(response.structured_content[:color]).to eq("magenta")
      expect(table.reload.color).to eq("magenta")
      expect(table.name).to eq("Projects")
    end

    it "removes the color when given an empty string" do
      table.update!(color: "slate")

      response = UpdateTableTool.call(table_id: table.id, color: "", server_context: server_context)

      expect(response.structured_content[:color]).to be_nil
      expect(table.reload.color).to be_nil
      expect(table.name).to eq("Projects")
    end

    it "rejects an unknown color and keeps the current one" do
      table.update!(color: "slate")

      response = UpdateTableTool.call(table_id: table.id, color: "chartreuse", server_context: server_context)

      expect(response.structured_content[:error]).to eq("invalid_input")
      expect(table.reload.color).to eq("slate")
    end

    it "rejects a call with no name, icon or color" do
      response = UpdateTableTool.call(table_id: table.id, server_context: server_context)

      expect(response.structured_content[:error]).to eq("invalid_input")
    end

    it "rejects a name already taken in the space" do
      space.tables.create!(organization: organization, name: "Taken")

      response = UpdateTableTool.call(table_id: table.id, name: "Taken", server_context: server_context)

      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("invalid_input")
      expect(table.reload.name).not_to eq("Taken")
    end

    it "rejects a blank name" do
      response = UpdateTableTool.call(table_id: table.id, name: " ", server_context: server_context)

      expect(response.error?).to be true
      expect(response.structured_content[:error]).to eq("invalid_input")
    end

    it "returns not found for a table in another organization" do
      response = UpdateTableTool.call(
        table_id: table.id,
        name: "Hijacked",
        server_context: { user_id: users(:maria).id, organization_id: organizations(:hc).id }
      )

      expect(response.structured_content[:error]).to eq("not_found")
      expect(table.reload.name).not_to eq("Hijacked")
    end

    it "refuses a user who can't edit the table" do
      private_table = spaces(:hc_pawels).tables.create!(organization: organizations(:hc), name: "Private")

      response = UpdateTableTool.call(
        table_id: private_table.id,
        name: "Hijacked",
        server_context: { user_id: users(:maria).id, organization_id: organizations(:hc).id }
      )

      expect(response.structured_content[:error]).to eq("unauthorized")
      expect(private_table.reload.name).to eq("Private")
    end
  end
end
