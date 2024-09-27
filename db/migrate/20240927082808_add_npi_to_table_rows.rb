class AddNpiToTableRows < ActiveRecord::Migration[7.1]
  def change
    add_column :table_rows, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :table_rows, :npi, unique: true
  end
end
