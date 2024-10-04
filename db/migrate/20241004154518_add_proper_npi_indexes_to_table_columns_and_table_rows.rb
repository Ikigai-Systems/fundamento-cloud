class AddProperNpiIndexesToTableColumnsAndTableRows < ActiveRecord::Migration[7.1]
  def change
    add_index :table_columns, [:table_id, :npi], unique: true
    remove_index :table_columns, :npi

    add_index :table_rows, [:table_id, :npi], unique: true
    remove_index :table_rows, :npi
  end
end
