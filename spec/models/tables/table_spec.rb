# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe Tables::Table, type: :model do
  fixtures :organizations
  fixtures :spaces
  fixtures "tables/tables"

  it 'should save with valid attributes' do
    table = tables_tables(:projects)
    expect(table.save).to be_truthy
  end

  it 'should not save without a name' do
    table = tables_tables(:projects)
    table.name = nil
    expect(table.save).to be_falsey
  end

  it 'should not save without an organization' do
    table = tables_tables(:projects)
    table.organization = nil
    expect(table.save).to be_falsey
  end
end