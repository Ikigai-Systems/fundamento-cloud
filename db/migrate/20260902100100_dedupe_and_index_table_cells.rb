# A table cell is uniquely identified by (row, column), but nothing enforced that.
# Several write paths use find_by/find_or_create_by, which silently picks one of the
# duplicates. Snapshots and restores cannot be correct without the constraint.
class DedupeAndIndexTableCells < ActiveRecord::Migration[8.1]
  def up
    # Keep the newest cell for each (row, column) pair.
    execute <<~SQL
      DELETE FROM table_cells older
      USING table_cells newer
      WHERE older.row_id = newer.row_id
        AND older.column_id = newer.column_id
        AND older.id < newer.id
    SQL

    add_index :table_cells, [:row_id, :column_id], unique: true

    # Redundant now: the new unique index has row_id as its leading column.
    remove_index :table_cells, :row_id, name: "index_table_cells_on_row_id"
  end

  def down
    add_index :table_cells, :row_id, name: "index_table_cells_on_row_id"
    remove_index :table_cells, [:row_id, :column_id]
  end
end
