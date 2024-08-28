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

  describe "#import_from_csv" do
    before do
      # TODO: By default fixtures and database changes are kept between test cases, hence we clear the database to the expected state
      # later so database_clearner will be needed
      table = tables_tables(:projects)
      table.cells.delete_all
      table.rows.delete_all
      table.columns.delete_all
    end

    it "imports data" do
      table = tables_tables(:projects)

      csv_file_path = file_fixture("tables/projects.csv")

      table.import_from_csv(csv_file_path)

      table_data = table.data_to_json

      expect(table_data).to eq([
        {
          "Project Key" => "JIRA",
          "Project Name" => "Jira",
          "Owner" => "Pawel"
        },
        {
          "Project Key" => "CON",
          "Project Name" => "Confluence",
          "Owner" => "Stefan"
        },
        {
          "Project Key" => "MON",
          "Project Name" => "Monday",
          "Owner" => "Evgenii"
        }
      ])
    end
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
            "Description" => "Some project tracking tool",
            "Value" => "3*5",
          },
          {
            "Key" => "CONFLUENCE",
            "Name" => "Confluence",
            "Description" => "Some knowledge sharing tool",
            "Value" => "5 - 2",
          },
          {
            "Key" => "MON",
            "Name" => "Monday",
            "Description" => "Hardest day of the week",
            "Value" => "0-1",
          }
        ])
      end
    end

    context "column with a simple math formula" do
      before do
        tables_columns(:project_value).update!(
          kind: :formula,
          value_formula: "3 * 5"
        )
      end

      it "returns the same calculated value for all rows" do
        table_data = tables_tables(:projects).data_to_json(evaluate_formulas: true)

        expect(table_data).to eq([
          {
            "Key" => "JIRA",
            "Name" => "Jira",
            "Description" => "Some project tracking tool",
            "Value" => 15,
          },
          {
            "Key" => "CONFLUENCE",
            "Name" => "Confluence",
            "Description" => "Some knowledge sharing tool",
            "Value" => 15,
          },
          {
            "Key" => "MON",
            "Name" => "Monday",
            "Description" => "Hardest day of the week",
            "Value" => 15,
          }
        ])
      end
    end
  end

  context "formulas that reference objects" do
    fixtures "tables/advanced_formulas/columns"
    fixtures "tables/rows"
    fixtures "tables/advanced_formulas/cells"

    it "returns data" do
      table_data = tables_tables(:projects).data_to_json(evaluate_formulas: true)

      expect(table_data).to eq([
        {
          "Key" => "JIRA",
          "Name" => "Jira",
          "Description" => "Some project tracking tool",
          "Title" => "JIRA Jira",
        },
        {
          "Key" => "CONFLUENCE",
          "Name" => "Confluence",
          "Description" => "Some knowledge sharing tool",
          "Title" => "CONFLUENCE Confluence",
        },
        {
          "Key" => "MON",
          "Name" => "Monday",
          "Description" => "Hardest day of the week",
          "Title" => "MON Monday",
        }
      ])
    end
  end
end