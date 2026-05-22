class AddArchivedToSpaces < ActiveRecord::Migration[8.1]
  def change
    add_column :spaces, :archived, :boolean, null: false, default: false
    add_index :spaces, [:organization_id, :archived]
  end
end
