class MigrateTableToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Change table_id columns in child tables from bigint to string
    change_column :table_cells, :table_id, :string
    change_column :table_columns, :table_id, :string
    change_column :table_rows, :table_id, :string

    # Step 2: Update table_id columns to use NPIs from tables.npi
    execute <<-SQL
      UPDATE table_cells
      SET table_id = tables.npi
      FROM tables
      WHERE table_cells.table_id::text = tables.id::text
    SQL

    execute <<-SQL
      UPDATE table_columns
      SET table_id = tables.npi
      FROM tables
      WHERE table_columns.table_id::text = tables.id::text
    SQL

    execute <<-SQL
      UPDATE table_rows
      SET table_id = tables.npi
      FROM tables
      WHERE table_rows.table_id::text = tables.id::text
    SQL

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :tables, :id

    # Step 4: Rename npi column to id
    rename_column :tables, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE tables ADD PRIMARY KEY (id)"
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for tables"
  end
end
