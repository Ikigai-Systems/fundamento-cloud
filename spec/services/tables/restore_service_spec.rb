require "rails_helper"

RSpec.describe Tables::RestoreService, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }
  let(:pawel) { users(:pawel) }

  # The state we will come back to, plus a set of changes that touch content, structure
  # and both linked lists.
  let!(:baseline) { Tables::VersionSnapshotService.new(table, kind: :initial).call }
  let!(:baseline_data) { TableDataBlueprint.render(baseline.reader.to_table_data) }

  def diverge!
    Current.set(user: pawel, change_source: "ui") do
      tables_cells(:projects_jira_key).update!(value: "DIVERGED")
      table.add_row
      table.columns.create!(organization: table.organization, previous_column: table.columns_in_order.last, name: "Temp", kind: :string)
      table.reload.rows_in_order.last.destroy
    end
  end

  it "puts the content back exactly as it was" do
    diverge!

    described_class.new(table, baseline).call

    expect(TableDataBlueprint.render(table.reload.data_to_json)).to eq baseline_data
  end

  # Column widths in AdvancedTable's viewProps and formulas both key off column ids, so
  # a restore that invented new ids would break things outside the table.
  it "restores the original row and column ids" do
    original_row_ids = table.rows_in_order.map(&:id)
    original_column_ids = table.columns_in_order.map(&:id)

    diverge!
    described_class.new(table, baseline).call

    expect(table.reload.rows_in_order.map(&:id)).to eq original_row_ids
    expect(table.columns_in_order.map(&:id)).to eq original_column_ids
  end

  it "leaves both linked lists walkable" do
    diverge!
    described_class.new(table, baseline).call
    table.reload

    expect(table.rows_in_order.size).to eq table.rows.count
    expect(table.columns_in_order.size).to eq table.columns.count
  end

  it "saves the pre-restore state as its own version first, so the restore can be undone" do
    diverge!
    diverged_data = TableDataBlueprint.render(table.reload.data_to_json)

    restored = described_class.new(table, baseline).call
    pre_restore = table.versions.where(kind: :auto).order(:sequential_id).last

    expect(TableDataBlueprint.render(pre_restore.reader.to_table_data)).to eq diverged_data
    expect(restored.sequential_id).to be > pre_restore.sequential_id
  end

  it "records the restore as a version pointing back at its source" do
    diverge!

    restored = described_class.new(table, baseline).call

    expect(restored).to be_restore
    expect(restored.restored_from).to eq baseline
    expect(restored.content_digest).to eq baseline.content_digest
  end

  it "collapses the rewrite into a single change event" do
    diverge!
    table.change_events.delete_all

    described_class.new(table, baseline).call

    expect(table.change_events.pluck(:kind)).to eq ["restored"]
  end

  it "leaves the table untouched when the snapshot cannot be read" do
    diverge!
    baseline.snapshot.purge
    diverged_data = TableDataBlueprint.render(table.reload.data_to_json)

    expect { described_class.new(table, baseline.reload).call }
      .to raise_error(Tables::SnapshotReader::UnsupportedFormat)

    expect(TableDataBlueprint.render(table.reload.data_to_json)).to eq diverged_data
  end

  it "does not add a version when the table already matches the target" do
    expect { described_class.new(table, baseline).call }.not_to change { table.versions.count }
  end

  # The restored_from foreign key would otherwise block deleting the source version, and
  # with it the whole table.
  it "lets the version it was restored from be deleted afterwards" do
    diverge!
    restored = described_class.new(table, baseline).call

    expect { baseline.destroy }.not_to raise_error
    expect(restored.reload.restored_from).to be_nil
  end

  it "lets the table be deleted afterwards" do
    diverge!
    described_class.new(table, baseline).call

    expect { table.destroy }.not_to raise_error
  end
end
