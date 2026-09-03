require "rails_helper"

RSpec.describe Tables::SnapshotBuilder, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  def snapshot(**options)
    result = described_class.new(table, **options).build
    payload = JSON.parse(Zlib.gunzip(result.io.read))
    result.io.close!
    [result, payload]
  end

  it "captures every column and row in their linked-list order" do
    _result, payload = snapshot

    expect(payload["format"]).to eq described_class::FORMAT_VERSION
    expect(payload["columns"].map { |c| c["name"] }).to eq ["Key", "Name", "Description", "Value"]
    expect(payload["rows"]).to eq table.rows_in_order.map(&:id)
  end

  it "lays cells out as a rows x columns matrix" do
    _result, payload = snapshot

    expect(payload["cells"].first).to eq ["JIRA", "Jira", "Some project tracking tool", "3*5"]
    expect(payload["cells"].size).to eq 3
  end

  it "reports the dimensions it wrote" do
    result, _payload = snapshot

    expect(result).to have_attributes(row_count: 3, column_count: 4)
    expect(result.byte_size).to be_positive
  end

  # The whole point of chunking is that a 50k-row table never lands in memory at once;
  # the output must not depend on how many chunks it took.
  it "produces the same payload however many chunks it takes" do
    _whole, payload_whole = snapshot
    _chunked, payload_chunked = snapshot(chunk_size: 1)

    expect(payload_chunked).to eq payload_whole
  end

  it "digests the content, not the compressed bytes" do
    first, = snapshot
    second, = snapshot

    expect(second.digest).to eq first.digest

    tables_cells(:projects_jira_key).update!(value: "CHANGED")
    changed, = snapshot

    expect(changed.digest).not_to eq first.digest
  end

  it "handles a table with no rows" do
    table.cells.delete_all
    table.rows.delete_all

    result, payload = snapshot

    expect(result.row_count).to eq 0
    expect(payload["cells"]).to eq []
    expect(payload["columns"].size).to eq 4
  end
end
