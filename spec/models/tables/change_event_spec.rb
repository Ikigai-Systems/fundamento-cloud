require "rails_helper"

RSpec.describe Tables::ChangeEvent, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:organization) { organizations(:is) }
  let(:table) { tables_tables(:projects) }
  let(:other_table) { tables_tables(:orders) }

  def record(on: table, **attributes)
    described_class.create!(
      organization: organization,
      table: on,
      kind: :cell_updated,
      source: "system",
      payload: {},
      **attributes,
    )
  end

  describe "sequential_id" do
    it "numbers a table's events from one, in the order they are recorded" do
      expect([record, record, record].map(&:sequential_id)).to eq([1, 2, 3])
    end

    it "numbers each table independently" do
      record
      record

      expect(record(on: other_table).sequential_id).to eq(1)
    end

    it "refuses two events with the same number on one table" do
      first = record

      expect { record.update_column(:sequential_id, first.sequential_id) }
        .to raise_error(ActiveRecord::RecordNotUnique)
    end

    # The advisory lock is the only thing standing between concurrent cell edits and a
    # duplicate number, and a duplicate number is a failed user edit -- change events are
    # written in the same transaction as the mutation they describe.
    #
    # Asserted by looking for the lock rather than by racing threads: every example here runs
    # inside DatabaseCleaner's transaction, so a second connection cannot see the fixtures at
    # all. Real contention is measured by hand against seeded data; what a spec can pin is that
    # the lock is taken, and taken on a key of its own so change events and version snapshots
    # do not wait on each other.
    it "takes an advisory lock on the table, distinct from the snapshot counter's" do
      record

      held = described_class.connection.select_values(<<~SQL)
        SELECT objid FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()
      SQL

      expect(held).to include(Zlib.crc32("table_#{table.id}_change_events"))
      expect(held).not_to include(Zlib.crc32("table_#{table.id}_versions"))
    end
  end

  describe ".chronological" do
    it "orders by sequential_id rather than id" do
      first, second = record, record

      # What a restore does: the row goes back in with its archived sequential_id, but `id`
      # comes from a sequence shared across every tenant and is reassigned, so it is now the
      # largest in the table. Ordering by id would put this event last instead of first.
      restored = record
      restored.update_column(:sequential_id, 0)

      expect(table.change_events.chronological.to_a).to eq([restored, first, second])
      expect(restored.id).to be > second.id
    end
  end
end
