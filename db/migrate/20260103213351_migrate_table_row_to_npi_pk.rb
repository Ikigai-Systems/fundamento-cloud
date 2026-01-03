class MigrateTableRowToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 0: Drop foreign key constraint from table_cells to table_rows
    remove_foreign_key :table_cells, :table_rows, column: :row_id if foreign_key_exists?(:table_cells, :table_rows, column: :row_id)

    # Step 1: Change row_id in table_cells from bigint to string
    change_column :table_cells, :row_id, :string

    # Step 2: Update table_cells.row_id to use NPIs
    execute <<-SQL
      UPDATE table_cells
      SET row_id = table_rows.npi
      FROM table_rows
      WHERE table_cells.row_id::text = table_rows.id::text
    SQL

    # Step 3: Drop self-referencing foreign key constraint
    remove_foreign_key :table_rows, column: :previous_row_id if foreign_key_exists?(:table_rows, column: :previous_row_id)

    # Step 4: Change self-referencing previous_row_id from bigint to string
    change_column :table_rows, :previous_row_id, :string

    # Step 5: Update previous_row_id to use NPIs (self-referencing)
    execute <<-SQL
      UPDATE table_rows AS tr1
      SET previous_row_id = tr2.npi
      FROM table_rows AS tr2
      WHERE tr1.previous_row_id::text = tr2.id::text
    SQL

    # Step 6: Drop the old id column (drops PK constraint automatically)
    remove_column :table_rows, :id

    # Step 7: Rename npi column to id
    rename_column :table_rows, :npi, :id

    # Step 8: Add primary key constraint on id
    execute "ALTER TABLE table_rows ADD PRIMARY KEY (id)"

    # Step 9: Re-add foreign key constraints
    add_foreign_key :table_cells, :table_rows, column: :row_id
    add_foreign_key :table_rows, :table_rows, column: :previous_row_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for table_rows"
  end
end
