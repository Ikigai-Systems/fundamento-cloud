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

  context "number, decimal and checkbox columns" do
    fixtures "tables/columns"
    fixtures "tables/rows"
    fixtures "tables/cells"

    let(:table) { tables_tables(:projects) }
    let(:row) { table.rows_in_order.first }
    let(:membership) { organization_memberships(:om_is_pawel) }

    def add_column(name, kind, **attributes)
      table.columns.create!(name:, kind:, previous_column: table.columns_in_order.last, organization_id: table.organization_id, **attributes)
    end

    def set_cell(column, value)
      table.cells.create!(column:, row:, value:, organization_id: table.organization_id)
    end

    def evaluated(formula)
      column = add_column("Result #{table.columns.count}", :formula, formula:)
      table.data_to_json(evaluate_formulas: true, evaluate_as: membership)[:rows].find { |r| r["id"] == row.id }[column.id]
    end

    let!(:price) { add_column("Price", :decimal) }
    let!(:quantity) { add_column("Quantity", :number) }
    let!(:done) { add_column("Done", :checkbox) }

    before do
      set_cell(price, "19.99")
      set_cell(quantity, "3")
    end

    it "does arithmetic on number and decimal columns without Number()" do
      expect(evaluated("CurrentRow(\"Price\") * CurrentRow(\"Quantity\")")).to eq 59.97
      expect(evaluated("CurrentRow(\"Price\") * 100")).to eq 1999
    end

    it "reads decimals exactly" do
      set_cell(add_column("Other", :decimal), "0.2")
      set_cell(add_column("Tenth", :decimal), "0.1")

      expect(evaluated("CurrentRow(\"Other\") + CurrentRow(\"Tenth\") == 0.3")).to eq true
    end

    it "keeps the text of a number as it was typed when concatenated" do
      set_cell(add_column("Amount", :decimal), "1.50")

      expect(evaluated("Concatenate(CurrentRow(\"Amount\"), \"|\", CurrentRow(\"Quantity\"))")).to eq "1.5|3"
    end

    it "counts a blank number cell as zero in arithmetic" do
      add_column("Empty", :number)

      expect(evaluated("CurrentRow(\"Empty\") + 1")).to eq 1
    end

    it "reports unreadable text in a number column, naming the column" do
      set_cell(add_column("Broken", :number), "abc")

      expect(evaluated("CurrentRow(\"Broken\") + 1")).to match(/Broken/)
    end

    it "holds a checkbox as true or false, and an empty one as false" do
      expect(evaluated("If(CurrentRow(\"Done\"), 1, 0)")).to eq 0

      set_cell(done, "t")

      expect(evaluated("If(CurrentRow(\"Done\"), 1, 0)")).to eq 1
    end

    it "gives Table() rows the same typed numbers" do
      typed = Tables::RowReader.new(table, evaluate_as: membership).typed_rows.find { |r| r["id"] == row.id }

      expect(typed["Price"]).to eq Rational(1999, 100)
      expect(typed["Quantity"]).to eq 3
      expect(typed["Done"]).to eq false
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

    context "rows read through Table()" do
      let!(:finish) { add_column("End", :formula, previous: length, formula: "CurrentRow(\"Start\") + Days(10)", configuration: { "dateStoredFormat" => 2 }) }
      let(:hash_row) { Tables::RowReader.new(table, evaluate_as: membership).typed_rows.find { |r| r["id"] == row.id } }

      it "holds typed values, by column name and by id" do
        expect(hash_row["Start"]).to eq Date.new(2024, 1, 31)
        expect(hash_row[start.id]).to eq Date.new(2024, 1, 31)
        expect(hash_row["Length"]).to eq Formula::Duration.parse("5h 30m")
      end

      it "holds the typed result of a formula column" do
        expect(hash_row["End"]).to eq Date.new(2024, 2, 10)
      end

      it "holds a formula error as its text" do
        add_column("Broken", :formula, previous: finish, formula: "Nonexistent()")

        expect(hash_row["Broken"]).to include "Undefined function: Nonexistent"
      end

      it "holds a checkbox as true or false" do
        done = add_column("Done", :checkbox, previous: finish)
        set_cell(done, "t")

        expect(hash_row["Done"]).to eq true
      end

      it "keeps one id key" do
        expect(hash_row.keys.count { |key| key.to_s == "id" }).to eq 1
      end

      it "lets a formula use a date column of another table without ToDate" do
        result = FormulaService.evaluate("Dig(First(Table(\"#{table.id}\")), \"Start\") - Date(2024, 1, 1)", nil, membership)

        expect(result["result"].to_s).to eq "30 days"
      end
    end

    context "formula columns that read other formula columns" do
      let!(:finish) { add_column("End", :formula, previous: length, formula: "CurrentRow(\"Start\") + Days(10)", configuration: { "dateStoredFormat" => 2 }) }

      it "reads the typed result of an earlier formula column" do
        left = add_column("Gap", :formula, previous: finish, formula: "CurrentRow(\"End\") - CurrentRow(\"Start\")")

        expect(evaluated(left)).to eq "10 days"
      end

      it "reads a formula column that comes later in the table" do
        early = add_column("Early", :formula, previous: finish, formula: "CurrentRow(\"Late\") + Days(1)", configuration: { "dateStoredFormat" => 2 })
        late = add_column("Late", :formula, previous: early, formula: "CurrentRow(\"End\") + Days(1)", configuration: { "dateStoredFormat" => 2 })

        expect(evaluated(early)).to eq "12.02.2024"
        expect(evaluated(late)).to eq "11.02.2024"
      end

      it "follows a chain of formula columns and finds them by id" do
        second = add_column("Second", :formula, previous: finish, formula: "CurrentRow(\"End\") + Days(1)", configuration: { "dateStoredFormat" => 2 })
        third = add_column("Third", :formula, previous: second, formula: "CurrentRow(\"#{second.id}\") + Days(1)", configuration: { "dateStoredFormat" => 2 })

        expect(evaluated(third)).to eq "12.02.2024"
      end

      it "works out each formula once per row" do
        a = add_column("A", :formula, previous: finish, formula: "CurrentRow(\"End\") + Days(1)", configuration: { "dateStoredFormat" => 2 })
        add_column("B", :formula, previous: a, formula: "CurrentRow(\"End\") + Days(2)", configuration: { "dateStoredFormat" => 2 })
        allow(FormulaService).to receive(:evaluate).and_call_original

        table.data_to_json(evaluate_formulas: true, evaluate_as: membership)

        expect(FormulaService).to have_received(:evaluate).with("CurrentRow(\"Start\") + Days(10)", any_args).exactly(table.rows.count).times
      end

      it "reports a circular reference by naming the loop" do
        a = add_column("A", :formula, previous: finish, formula: "CurrentRow(\"B\")")
        add_column("B", :formula, previous: a, formula: "CurrentRow(\"A\")")

        expect(evaluated(a)).to include "Circular reference: A -> B -> A"
      end

      it "reports a column that reads itself" do
        selfish = add_column("Selfish", :formula, previous: finish, formula: "CurrentRow(\"Selfish\")")

        expect(evaluated(selfish)).to include "Circular reference: Selfish -> Selfish"
      end

      it "names the column whose formula failed" do
        broken = add_column("Broken", :formula, previous: finish, formula: "Nonexistent()")
        user = add_column("User", :formula, previous: broken, formula: "CurrentRow(\"Broken\")")

        expect(evaluated(user)).to include "Column \"Broken\" has an error: Undefined function: Nonexistent"
      end
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

    it "reads and writes the other stored formats, and ISO text when none is chosen" do
      us = add_column("US", :date, previous: length, configuration: { "dateStoredFormat" => 0 })
      eu = add_column("EU", :date, previous: us, configuration: { "dateStoredFormat" => 1 })
      plain = add_column("Plain", :date, previous: eu)
      set_cell(us, "1/31/2024")
      set_cell(eu, "5/02/2024")
      set_cell(plain, "2024-01-31")
      us_next = add_column("US next", :formula, previous: plain, formula: "CurrentRow(\"US\") + Days(1)", configuration: { "dateStoredFormat" => 0 })
      eu_next = add_column("EU next", :formula, previous: us_next, formula: "CurrentRow(\"EU\") + Days(1)", configuration: { "dateStoredFormat" => 1 })
      plain_next = add_column("Plain next", :formula, previous: eu_next, formula: "CurrentRow(\"Plain\") + Days(1)")

      expect([evaluated(us_next), evaluated(eu_next), evaluated(plain_next)]).to eq ["2/1/2024", "6/02/2024", "2024-02-01"]
    end

    it "does arithmetic on duration columns" do
      doubled = add_column("Doubled", :formula, previous: length, formula: "CurrentRow(\"Length\") * 2")

      expect(evaluated(doubled)).to eq "11 hrs"
    end

    it "reports unparseable cell text as a formula error naming the column and value" do
      set_cell(add_column("Bad", :date, previous: length), "not a date")
      broken = add_column("Broken", :formula, previous: table.columns.find_by(name: "Bad"), formula: "CurrentRow(\"Bad\") - CurrentRow(\"Start\")")

      expect(evaluated(broken)).to include 'Cannot subtract Text (column "Bad" holds "not a date", not a valid date) and Date'
    end

    it "names an unparseable duration or datetime the same way" do
      set_cell(add_column("Bad length", :duration, previous: length), "soon")
      broken = add_column("Broken", :formula, previous: table.columns.find_by(name: "Bad length"), formula: "CurrentRow(\"Start\") + CurrentRow(\"Bad length\")")

      expect(evaluated(broken)).to include 'column "Bad length" holds "soon", not a valid duration'
    end

    it "still lets a formula show or compare the unreadable text" do
      set_cell(add_column("Bad", :date, previous: length), "not a date")
      shown = add_column("Shown", :formula, previous: table.columns.find_by(name: "Bad"), formula: "CurrentRow(\"Bad\")")

      expect(evaluated(shown)).to eq "not a date"
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