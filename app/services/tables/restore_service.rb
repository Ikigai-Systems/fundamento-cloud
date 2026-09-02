# Puts a table back to the state captured by one of its versions.
#
# Non-destructive: the current state is snapshotted into its own version first, so the
# restore can itself be undone, and the restore appears in the timeline as a version of
# its own rather than silently rewriting history.
#
# Row and column NPIs are restored as they were, because things outside the table point
# at them -- column widths in AdvancedTable's viewProps, formulas that reference column
# ids, and documents-kind cell values.
module Tables
  class RestoreService
    COLUMN_BATCH_SIZE = 200
    ROW_BATCH_SIZE = 1_000
    CELL_BATCH_SIZE = 5_000

    def initialize(table, version)
      @table = table
      @version = version
    end

    def call
      # Read the whole snapshot before touching anything: a corrupt or missing blob must
      # not leave a wiped table behind.
      payload = version.reader.payload
      columns = payload["columns"]
      row_ids = payload["rows"]
      cells = payload["cells"]

      # Capture where we are now, so this restore is reversible.
      Tables::VersionSnapshotService.new(table).call

      Table.transaction do
        Tables::ChangeRecorder.bulk(
          table,
          kind: :restored,
          payload: { version_id: version.id, sequential_id: version.sequential_id },
        ) do
          table.cells.delete_all
          table.rows.delete_all
          table.columns.delete_all

          insert_columns(columns)
          insert_rows(row_ids)
          insert_cells(columns, row_ids, cells)
        end
      end

      table.reload

      Tables::VersionSnapshotService.new(table, kind: :restore, restored_from: version).call
    end

    private

    attr_reader :table, :version

    def now = @now ||= Time.current

    def insert_columns(columns)
      previous_id = nil

      rows = columns.map do |column|
        record = {
          id: column["id"],
          table_id: table.id,
          organization_id: table.organization_id,
          name: column["name"],
          kind: Tables::Column.kinds.fetch(column["kind"], 0),
          options: column["options"],
          configuration: column["configuration"],
          formula: column["formula"],
          previous_column_id: previous_id,
          created_at: now,
          updated_at: now,
        }
        previous_id = column["id"]
        record
      end

      # Batched in chain order, so each previous_column_id points at a row inserted in
      # this or an earlier statement.
      rows.each_slice(COLUMN_BATCH_SIZE) { |batch| Tables::Column.insert_all!(batch) }
    end

    def insert_rows(row_ids)
      previous_id = nil

      rows = row_ids.map do |row_id|
        record = {
          id: row_id,
          table_id: table.id,
          organization_id: table.organization_id,
          previous_row_id: previous_id,
          created_at: now,
          updated_at: now,
        }
        previous_id = row_id
        record
      end

      rows.each_slice(ROW_BATCH_SIZE) { |batch| Tables::Row.insert_all!(batch) }
    end

    def insert_cells(columns, row_ids, cells)
      buffer = []

      row_ids.each_with_index do |row_id, row_index|
        values = cells[row_index] || []

        columns.each_with_index do |column, column_index|
          buffer << {
            table_id: table.id,
            organization_id: table.organization_id,
            row_id: row_id,
            column_id: column["id"],
            value: values[column_index],
            created_at: now,
            updated_at: now,
          }

          if buffer.size >= CELL_BATCH_SIZE
            Tables::Cell.insert_all!(buffer)
            buffer = []
          end
        end
      end

      Tables::Cell.insert_all!(buffer) if buffer.any?
    end
  end
end
