class AddNpiToSpaces < ActiveRecord::Migration[7.1]
  def change
    add_column :spaces, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :spaces, :npi, unique: true
  end
end
