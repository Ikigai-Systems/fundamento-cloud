require "rails_helper"

RSpec.describe Tables::ChangeSummary, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  def event(kind, payload)
    Tables::ChangeEvent.new(
      table_id: table.id,
      organization_id: table.organization_id,
      kind: kind,
      source: "ui",
      payload: payload,
    )
  end

  # A person reading the history wants to know how much of the table moved, not how many
  # rows the log happens to hold.
  it "counts distinct cells, not events" do
    events = [
      event(:cell_updated, { "row_id" => "r1", "column_id" => "c1", "after" => "a" }),
      event(:cell_updated, { "row_id" => "r1", "column_id" => "c1", "after" => "b" }),
      event(:cell_updated, { "row_id" => "r2", "column_id" => "c1", "after" => "c" }),
    ]

    expect(described_class.for(events)).to include("cells_changed" => 2, "events" => 3)
  end

  it "counts distinct rows and columns" do
    events = [
      event(:row_inserted, { "row_id" => "r1" }),
      event(:row_deleted, { "row_id" => "r2" }),
      event(:column_added, { "column_id" => "c9", "name" => "Notes" }),
    ]

    expect(described_class.for(events))
      .to include("rows_added" => 1, "rows_deleted" => 1, "columns_added" => 1)
  end

  it "spells out structural changes and leaves cell edits as a number" do
    events = [
      event(:column_renamed, { "column_id" => "c1", "before" => "Status", "after" => "State" }),
      event(:column_removed, { "column_id" => "c2", "name" => "Old" }),
      event(:cell_updated, { "row_id" => "r1", "column_id" => "c1" }),
    ]

    expect(described_class.for(events)["structure"])
      .to eq ['renamed "Status" to "State"', 'removed "Old"']
  end

  it "caps the structure list so one huge restructure cannot bloat the summary" do
    events = 20.times.map { |i| event(:column_added, { "column_id" => "c#{i}", "name" => "Col #{i}" }) }

    expect(described_class.for(events)["structure"].size).to eq 10
  end
end
