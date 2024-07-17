class AddNameToSpaces < ActiveRecord::Migration[7.1]
  def change
    add_column :spaces, :name, :string
    add_index :spaces, [:name, :organization_id], unique: true
  end
end
