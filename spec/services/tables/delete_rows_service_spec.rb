require 'rails_helper'

RSpec.describe Tables::DeleteRowsService, type: :service do
  fixtures :organizations
  fixtures :users
  fixtures :organization_memberships
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"
  fixtures "tables/cells"

  it "deletes all rows" do
    table_data = tables_tables(:projects).data_to_json

    expect(table_data).to match(hash_including(:rows, :columns))
    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    described_class.new(tables_tables(:projects)).call

    table_data = tables_tables(:projects).reload.data_to_json

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    expect(table_data[:rows]).to eq []
  end

  it "deletes first row" do
    table_data = tables_tables(:projects).data_to_json

    expect(table_data).to match(hash_including(:rows, :columns))
    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    described_class.new(tables_tables(:projects)).call(rows_to_delete: [
      tables_rows(:projects_row_1)
    ])

    table_data = tables_tables(:projects).reload.data_to_json

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    expect(table_data[:rows].map(&:values)).to match([
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])
  end

  it "deletes middle row" do
    table_data = tables_tables(:projects).data_to_json

    expect(table_data).to match(hash_including(:rows, :columns))
    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    described_class.new(tables_tables(:projects)).call(rows_to_delete: [
      tables_rows(:projects_row_2)
    ])

    table_data = tables_tables(:projects).reload.data_to_json

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])
  end

  it "deletes last row" do
    table_data = tables_tables(:projects).data_to_json

    expect(table_data).to match(hash_including(:rows, :columns))
    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    described_class.new(tables_tables(:projects)).call(rows_to_delete: [
      tables_rows(:projects_row_3)
    ])

    table_data = tables_tables(:projects).reload.data_to_json

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
    ])
  end

  it "deletes all rows (row by row)" do
    table_data = tables_tables(:projects).data_to_json

    expect(table_data).to match(hash_including(:rows, :columns))
    expect(table_data[:rows].map(&:values)).to match([
      array_including("JIRA", "Jira", "Some project tracking tool", "3*5"),
      array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "5 - 2"),
      array_including("MON", "Monday", "Hardest day of the week", "0-1"),
    ])

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    described_class.new(tables_tables(:projects)).call(rows_to_delete: [
      tables_rows(:projects_row_2),
      tables_rows(:projects_row_1),
      tables_rows(:projects_row_3)
    ])

    table_data = tables_tables(:projects).reload.data_to_json

    expect(table_data[:columns]).to match([
      have_attributes(name: "Key"),
      have_attributes(name: "Name"),
      have_attributes(name: "Description"),
      have_attributes(name: "Value"),
    ])

    expect(table_data[:rows]).to eq []
  end
end