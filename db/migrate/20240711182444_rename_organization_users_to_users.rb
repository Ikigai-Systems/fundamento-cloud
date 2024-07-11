class RenameOrganizationUsersToUsers < ActiveRecord::Migration[7.1]
  def change
    rename_table :organization_users, :users
  end
end
