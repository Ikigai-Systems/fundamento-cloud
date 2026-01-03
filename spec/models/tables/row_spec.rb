require 'rails_helper'

RSpec.describe Tables::Row, type: :model do
  fixtures :organizations
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      row = tables_rows(:projects_row_1)
      expect(row.id).to be_a(String)
      expect(row.id.length).to be >= 10
    end

    it "has string row_id in child cells" do
      organization = organizations(:is)
      space = spaces(:is_default)

      table = Table.create!(
        id: "testrow001",
        name: "Test Table",
        organization: organization,
        space: space,
        parent: space
      )

      column = table.columns.create!(
        id: "testcolrow1",
        name: "Test Column",
        organization: organization,
        kind: :string
      )

      row = table.rows.create!(
        id: "testrow001",
        organization: organization
      )

      cell = row.cells.create!(
        table: table,
        column: column,
        organization: organization,
        value: "test"
      )

      expect(cell.row_id).to be_a(String)
      expect(cell.row_id).to eq(row.id)
      expect(cell.row_id).to eq("testrow001")
    end
  end

  it 'should save with valid attributes' do
    row = tables_rows(:projects_row_1)
    expect(row.save).to be_truthy
  end

  it 'should not save without an organization' do
    row = tables_rows(:projects_row_1)
    row.organization = nil
    expect(row.save).to be_falsey
  end

  it 'tracks order' do
    row = tables_rows(:projects_row_2)
    expect(row.previous_row).to eq(tables_rows(:projects_row_1))
    expect(row.next_row).to eq(tables_rows(:projects_row_3))
  end
end
