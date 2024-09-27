class AddNpiToTableColumns < ActiveRecord::Migration[7.1]
  def change
    add_column :table_columns, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :table_columns, :npi, unique: true
  end
end
