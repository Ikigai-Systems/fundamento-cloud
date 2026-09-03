require "rails_helper"

# Ceilings that keep a table small enough for the snapshot builder to handle. They are
# enforced at every entry point that can grow a table, not just in the UI.
RSpec.describe "Table size limits", type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }
  let(:organization) { table.organization }

  describe "rows" do
    before { stub_const("Table::MAX_ROWS", 3) }

    it "refuses a row beyond the ceiling" do
      expect { table.add_row }.to raise_error(Table::TooLarge, /50|3 rows/)
    end

    it "refuses one created directly, so formula and MCP writes are covered too" do
      row = table.rows.build(organization: organization, previous_row: table.rows_in_order.last)

      expect(row).not_to be_valid
      expect(row.errors[:base].join).to match(/more than 3 rows/)
    end

    it "still allows a bulk rewrite, which checks the total up front instead" do
      expect {
        Tables::ChangeRecorder.bulk(table, kind: :restored) { table.rows.create!(organization: organization) }
      }.to change { table.rows.count }.by(1)
    end
  end

  describe "columns" do
    before { stub_const("Table::MAX_COLUMNS", 4) }

    it "refuses a column beyond the ceiling" do
      expect { table.ensure_room_for_columns!(1) }.to raise_error(Table::TooLarge, /more than 4 columns/)
    end

    it "refuses one created directly" do
      column = table.columns.build(organization: organization, name: "Extra", kind: :string)

      expect(column).not_to be_valid
      expect(column.errors[:base].join).to match(/more than 4 columns/)
    end
  end

  describe "cell values" do
    before { stub_const("Table::MAX_CELL_VALUE_LENGTH", 10) }

    it "refuses a value longer than the ceiling" do
      cell = tables_cells(:projects_jira_key)
      cell.value = "x" * 11

      expect(cell).not_to be_valid
    end
  end

  describe "CSV import" do
    let(:empty_table) { tables_tables(:orders) }

    before do
      empty_table.cells.delete_all
      empty_table.rows.delete_all
      empty_table.columns.delete_all
    end

    it "refuses a file with too many rows" do
      stub_const("Table::MAX_ROWS", 1)

      expect { empty_table.import_from_csv(file_fixture("tables/projects.csv")) }
        .to raise_error(Table::TooLarge, /more than 1 rows/)
      expect(empty_table.reload.rows.count).to eq 0
    end

    it "refuses a file with too many columns" do
      stub_const("Table::MAX_COLUMNS", 2)

      expect { empty_table.import_from_csv(file_fixture("tables/projects.csv")) }
        .to raise_error(Table::TooLarge, /maximum is 2/)
      expect(empty_table.reload.columns.count).to eq 0
    end

    it "records the import as one event rather than one per cell" do
      expect { empty_table.import_from_csv(file_fixture("tables/projects.csv")) }
        .to change { empty_table.change_events.count }.by(1)

      event = empty_table.change_events.last
      expect(event.kind).to eq "bulk_imported"
      expect(event.payload).to include("rows" => 3, "columns" => 3)
    end
  end
end
