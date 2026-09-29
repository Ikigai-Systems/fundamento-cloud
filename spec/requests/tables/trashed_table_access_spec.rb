require "rails_helper"

# The table's own controller 404s a trashed table through LoadTable, but its rows,
# columns and cells are separate controllers that each look the table up themselves.
# Without the same scoping a client that still has the page open keeps reading and
# writing the data of a table the user believes is deleted -- and those writes would
# survive into a restore.
RSpec.describe "reaching a trashed table's data", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces,
           "tables/tables", "tables/columns", "tables/rows"

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:table) { tables_tables(:projects) }

  before do
    sign_in pawel
    post select_organization_path(ikigai_systems)
    table.trash!(by: pawel)
  end

  it "does not serve the rows of a trashed table" do
    get table_rows_path(table)

    expect(response).to have_http_status(:not_found)
  end

  it "does not serve the columns of a trashed table" do
    get table_columns_path(table)

    expect(response).to have_http_status(:not_found)
  end
end
