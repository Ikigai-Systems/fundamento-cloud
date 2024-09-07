class AddAccessModeToSpaces < ActiveRecord::Migration[7.1]
  def change
    add_column :spaces, :access_mode, :integer, limit: 2, null: false, default: 0
  end
end
