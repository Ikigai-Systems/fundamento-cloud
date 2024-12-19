class CreateUniqueIndexOnOrganizationUsers < ActiveRecord::Migration[7.1]
  def change
    remove_index :organization_users, :user_id
    add_index :organization_users, [:user_id, :organization_id], unique: true
  end
end
