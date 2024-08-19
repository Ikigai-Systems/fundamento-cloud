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

  context "table data" do
    fixtures "tables/columns"
    fixtures "tables/rows"
    fixtures "tables/cells"

    describe "#data_to_json" do
      it "returns data" do
        table_data = tables_tables(:projects).data_to_json

        expect(table_data).to eq([
          {
            "Key" => "JIRA",
            "Name" => "Jira",
            "Description" => "Some project tracking tool"
          },
          {
            "Key" => "CONFLUENCE",
            "Name" => "Confluence",
            "Description" => "Some knowledge sharing tool"
          },
          {
            "Key" => "MON",
            "Name" => "Monday",
            "Description" => "Hardest day of the week"
          }
        ])
      end
    end
  end
end