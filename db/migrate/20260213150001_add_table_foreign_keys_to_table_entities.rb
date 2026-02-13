class AddTableForeignKeysToTableEntities < ActiveRecord::Migration[8.1]
  def change
    add_foreign_key :table_cells, :tables
    add_foreign_key :table_columns, :tables
    add_foreign_key :table_rows, :tables
  end
end
