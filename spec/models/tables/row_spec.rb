require 'rails_helper'

RSpec.describe Tables::Row, type: :model do
  fixtures :organizations
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"

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
