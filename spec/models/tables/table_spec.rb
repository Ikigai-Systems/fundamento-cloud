# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe Table, type: :model do
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

      expect(table_data).to match(hash_including(:rows, :columns))
      expect(table_data[:rows].map(&:values)).to match([
        array_including("JIRA", "Jira", "Pawel"),
        array_including("CON", "Confluence", "Stefan"),
        array_including("MON", "Monday", "Evgenii"),
      ])
      expect(table_data[:columns]).to match([
        have_attributes(name: "Project Key"),
        have_attributes(name: "Project Name"),
        have_attributes(name: "Owner"),
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
      end
    end

    context "column with a simple math formula" do
      before do
        tables_columns(:project_value).update!(
          kind: :formula,
          formula: "3 * 5"
        )
      end

      it "returns the same calculated value for all rows" do
        expect(FormulaEvalGateway).to receive(:batch_evaluate).exactly(1).times.and_return([
          {"result" => 15},
          {"result" => 15},
          {"result" => 15},
        ])

        table_data = tables_tables(:projects).data_to_json(evaluate_formulas: true)

        expect(table_data).to match(hash_including(:rows, :columns))
        expect(table_data[:rows].map(&:values)).to match([
          array_including("JIRA", "Jira", "Some project tracking tool", 15),
          array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", 15),
          array_including("MON", "Monday", "Hardest day of the week", 15),
        ])
        expect(table_data[:columns]).to match([
          have_attributes(name: "Key"),
          have_attributes(name: "Name"),
          have_attributes(name: "Description"),
          have_attributes(name: "Value"),
        ])
      end
    end
  end

  context "formulas that reference objects" do
    fixtures "tables/advanced_formulas/columns"
    fixtures "tables/rows"
    fixtures "tables/advanced_formulas/cells"

    it "returns data" do
      expect(FormulaEvalGateway).to receive(:batch_evaluate).exactly(1).times.and_return([
        {"result" => "JIRA Jira"},
        {"result" => "CONFLUENCE Confluence"},
        {"result" => "MON Monday"}
      ])

      table_data = tables_tables(:projects).data_to_json(evaluate_formulas: true)

      expect(table_data).to match(hash_including(:rows, :columns))
      expect(table_data[:rows].map(&:values)).to match([
        array_including("JIRA", "Jira", "Some project tracking tool", "JIRA Jira"),
        array_including("CONFLUENCE", "Confluence", "Some knowledge sharing tool", "CONFLUENCE Confluence"),
        array_including("MON", "Monday", "Hardest day of the week", "MON Monday"),
      ])
      expect(table_data[:columns]).to match([
        have_attributes(name: "Key"),
        have_attributes(name: "Name"),
        have_attributes(name: "Description"),
        have_attributes(name: "Title"),
      ])
    end
  end
end