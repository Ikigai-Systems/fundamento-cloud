class AdjustTablesNpiIndexToIncludeOrganization < ActiveRecord::Migration[7.1]
  def change
    remove_index :tables, :npi
    add_index :tables, [:npi, :organization_id], unique: true
  end
end
