require "rails_helper"

RSpec.describe Tables::SnapshotReader, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }
  let(:version) { Tables::VersionSnapshotService.new(table, kind: :initial).call }

  # The version viewer reuses TableDataBlueprint and the live rowstack grid, so the
  # reader has to hand back exactly what the live table endpoint would.
  it "reshapes the snapshot into the payload the live table endpoint serves" do
    expect(TableDataBlueprint.render(version.reader.to_table_data))
      .to eq TableDataBlueprint.render(table.data_to_json)
  end

  it "coerces checkbox columns the same way the live read path does" do
    column = table.columns.create!(organization: table.organization, previous_column: table.columns_in_order.last, name: "Done", kind: :checkbox)
    table.rows_in_order.each_with_index do |row, index|
      row.cells.create!(table: table, column: column, organization: table.organization, value: index.zero? ? "t" : "f")
    end

    reader = Tables::VersionSnapshotService.new(table).call.reader

    expect(reader.rows.map { |row| row[column.id] }).to eq [true, false, false]
  end

  it "refuses a snapshot it cannot understand rather than guessing" do
    version.snapshot.attach(
      io: StringIO.new(Zlib.gzip(%({"format":999}))),
      filename: "bogus.json.gz",
      content_type: "application/gzip",
    )

    expect { described_class.new(version.reload).payload }
      .to raise_error(described_class::UnsupportedFormat, /999/)
  end
end
