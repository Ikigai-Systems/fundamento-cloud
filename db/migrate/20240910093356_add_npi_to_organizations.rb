class AddNpiToOrganizations < ActiveRecord::Migration[7.1]
  def change
    add_column :organizations, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :organizations, :npi, unique: true
  end
end
