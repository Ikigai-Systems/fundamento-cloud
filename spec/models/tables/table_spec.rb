# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe Table, type: :model do
  fixtures :users
  fixtures :organizations
  fixtures :organization_memberships
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
        table_data = tables_tables(:projects).data_to_json(
          evaluate_formulas: true,
          evaluate_as: organization_memberships(:om_is_pawel)
        )

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

  context "date, datetime and duration columns" do
    fixtures "tables/columns"
    fixtures "tables/rows"
    fixtures "tables/cells"

    let(:table) { tables_tables(:projects) }
    let(:row) { table.rows_in_order.first }
    let(:membership) { organization_memberships(:om_is_pawel) }

    def add_column(name, kind, previous:, **attributes)
      table.columns.create!(name:, kind:, previous_column: previous, organization_id: table.organization_id, **attributes)
    end

    def set_cell(column, value)
      table.cells.create!(column:, row:, value:, organization_id: table.organization_id)
    end

    def evaluated(column)
      table.data_to_json(evaluate_formulas: true, evaluate_as: membership)[:rows].find { |r| r["id"] == row.id }[column.id]
    end

    let!(:start) { add_column("Start", :date, previous: tables_columns(:project_value), configuration: { "dateStoredFormat" => 2 }) }
    let!(:length) { add_column("Length", :duration, previous: start) }

    before do
      set_cell(start, "31.01.2024")
      set_cell(length, "5h 30m")
    end

    it "adds a duration to a date column and returns it in the column's stored format" do
      finish = add_column("End", :formula, previous: length, formula: "CurrentRow(\"Start\") + Days(10)", configuration: { "dateStoredFormat" => 2 })

      expect(evaluated(finish)).to eq "10.02.2024"
    end

    it "subtracts two date columns into a duration shown as text" do
      other = add_column("Other", :date, previous: length, configuration: { "dateStoredFormat" => 2 })
      set_cell(other, "10.03.2024")
      gap = add_column("Gap", :formula, previous: other, formula: "CurrentRow(\"Other\") - CurrentRow(\"Start\")")

      expect(evaluated(gap)).to eq "39 days"
    end

    it "reads a datetime as a wall-clock time in the organization's time zone (across a DST change)" do
      table.organization.update!(time_zone: "Europe/Warsaw")
      moment = add_column("At", :datetime, previous: length, configuration: { "dateStoredFormat" => 3 })
      set_cell(moment, "2024-03-30 12:00")
      later = add_column("Later", :formula, previous: moment, formula: "CurrentRow(\"At\") + Days(1)", configuration: { "dateStoredFormat" => 3 })

      expect(evaluated(later)).to eq "2024-03-31 13:00" # Days(1) is 24 h, and clocks went forward that night
    end

    it "does arithmetic on duration columns" do
      doubled = add_column("Doubled", :formula, previous: length, formula: "CurrentRow(\"Length\") * 2")

      expect(evaluated(doubled)).to eq "11 hrs"
    end

    it "reports unparseable cell text as a formula error rather than treating it as empty" do
      set_cell(add_column("Bad", :date, previous: length), "not a date")
      broken = add_column("Broken", :formula, previous: table.columns.find_by(name: "Bad"), formula: "CurrentRow(\"Bad\") + Days(1)")

      expect(evaluated(broken)).to match(/Unable to evaluate formula/)
    end

    it "leaves date and duration cells as stored text when formulas are not evaluated" do
      data = table.data_to_json

      expect(data[:rows].first[start.id]).to eq "31.01.2024"
      expect(data[:rows].first[length.id]).to eq "5h 30m"
    end
  end

  context "formulas that reference objects" do
    fixtures "tables/advanced_formulas/columns"
    fixtures "tables/rows"
    fixtures "tables/advanced_formulas/cells"

    it "returns data" do
      table_data = tables_tables(:projects).data_to_json(
        evaluate_formulas: true,
        evaluate_as: organization_memberships(:om_is_stefan)
      )

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

  describe "#destroy" do
    fixtures "tables/object_visitors"

    it "removes the table" do
      expect do
        tables_tables(:projects).destroy!
      end.not_to raise_error
    end
  end
end