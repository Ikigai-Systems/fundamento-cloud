class AddNpiToTeams < ActiveRecord::Migration[7.1]
  def change
    add_column :teams, :npi, :string, null: false, default: "id"
    add_index :teams, :npi, unique: true
  end
end
