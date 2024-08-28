require 'rails_helper'

RSpec.describe Tables::CellsController, type: :request do
  fixtures :organizations, :spaces, :users, :organization_users, "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:user) { users(:pawel) }
  let(:table) { tables_tables(:projects) }
  let(:cell) { tables_cells(:projects_jira_description) }

  before do
    sign_in user

    post select_organization_path(table.organization)

    expect(response).to have_http_status(:found)
  end

  describe "PATCH /tables/:table_id/rows/:row_id/cells/:id" do
    context "with valid attributes" do
      it "updates the cell" do
        patch table_row_cell_path(cell.table, cell.row, cell), params: { cell: { value: "Updated value" } }

        expect(response).to have_http_status(:ok)
        expect(cell.reload.value).to eq("Updated value")
      end
    end
  end
end