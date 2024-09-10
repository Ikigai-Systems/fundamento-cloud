class AddNpiToTeams < ActiveRecord::Migration[7.1]
  def change
    add_column :teams, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :teams, :npi, unique: true
  end
end
