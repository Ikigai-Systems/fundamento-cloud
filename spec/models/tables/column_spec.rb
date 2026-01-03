# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe Tables::Column, type: :model do
  fixtures :organizations
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      column = tables_columns(:project_name)
      expect(column.id).to eq("project_name")
    end

    it "has string column_id in child cells" do
      organization = organizations(:is)
      space = spaces(:is_default)

      table = Table.create!(
        id: "testcol001",
        name: "Test Table",
        organization: organization,
        space: space,
        parent: space
      )

      column = table.columns.create!(
        id: "testcolumn",
        name: "Test Column",
        organization: organization,
        kind: :string
      )

      row = table.rows.create!(
        organization: organization
      )

      cell = column.cells.create!(
        table: table,
        row: row,
        organization: organization,
        value: "test"
      )

      expect(cell.column_id).to be_a(String)
      expect(cell.column_id).to eq(column.id)
      expect(cell.column_id).to eq("testcolumn")
    end
  end

  it 'should save with valid attributes' do
    column = tables_columns(:project_name)
    expect(column.save).to be_truthy
  end

  it 'should not save without a name' do
    column = tables_columns(:project_name)
    column.name = nil
    expect(column.save).to be_falsey
  end

  it 'should not save without an organization' do
    column = tables_columns(:project_name)
    column.organization = nil
    expect(column.save).to be_falsey
  end

  it 'tracks order' do
    column = tables_columns(:project_name)
    expect(column.previous_column).to eq(tables_columns(:project_key))
    expect(column.next_column).to eq(tables_columns(:project_description))
  end

  describe "#to_kind" do
    it "converts unknown types to string" do
      expect(described_class.to_kind("reallyStrangeType")).to eq(:string)
    end

    it "converts known types to their internal representation" do
      expect(described_class.to_kind("multiSelect")).to eq(:multi_select)
      expect(described_class.to_kind("datetime")).to eq(:datetime)
      expect(described_class.to_kind("longText")).to eq(:long_text)
    end
  end
end