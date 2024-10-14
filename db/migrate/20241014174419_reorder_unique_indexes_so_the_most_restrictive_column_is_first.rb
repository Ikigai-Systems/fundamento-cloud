class ReorderUniqueIndexesSoTheMostRestrictiveColumnIsFirst < ActiveRecord::Migration[7.1]
  def change
    remove_index :tables, [:space_id, :name]
    add_index :tables, [:name, :space_id], unique: true

    remove_index :table_columns, [:table_id, :npi]
    add_index :table_columns, [:npi, :table_id], unique: true

    remove_index :table_rows, [:table_id, :npi]
    add_index :table_rows, [:npi, :table_id], unique: true
  end
end
