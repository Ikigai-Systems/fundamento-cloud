class AddNpiToTables < ActiveRecord::Migration[7.1]
  def change
    add_column :tables, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :tables, :npi, unique: true
  end
end
