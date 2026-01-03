class MigrateTableColumnToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 0: Drop foreign key constraint from table_cells to table_columns
    remove_foreign_key :table_cells, :table_columns, column: :column_id if foreign_key_exists?(:table_cells, :table_columns, column: :column_id)

    # Step 1: Change column_id in table_cells from bigint to string
    change_column :table_cells, :column_id, :string

    # Step 2: Update table_cells.column_id to use NPIs
    execute <<-SQL
      UPDATE table_cells
      SET column_id = table_columns.npi
      FROM table_columns
      WHERE table_cells.column_id::text = table_columns.id::text
    SQL

    # Step 3: Drop self-referencing foreign key constraint
    remove_foreign_key :table_columns, column: :previous_column_id if foreign_key_exists?(:table_columns, column: :previous_column_id)

    # Step 4: Change self-referencing previous_column_id from bigint to string
    change_column :table_columns, :previous_column_id, :string

    # Step 5: Update previous_column_id to use NPIs (self-referencing)
    execute <<-SQL
      UPDATE table_columns AS tc1
      SET previous_column_id = tc2.npi
      FROM table_columns AS tc2
      WHERE tc1.previous_column_id::text = tc2.id::text
    SQL

    # Step 6: Drop the old id column (drops PK constraint automatically)
    remove_column :table_columns, :id

    # Step 7: Rename npi column to id
    rename_column :table_columns, :npi, :id

    # Step 8: Add primary key constraint on id
    execute "ALTER TABLE table_columns ADD PRIMARY KEY (id)"

    # Step 9: Re-add foreign key constraints
    add_foreign_key :table_cells, :table_columns, column: :column_id
    add_foreign_key :table_columns, :table_columns, column: :previous_column_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for table_columns"
  end
end
