class AddUniqueIndexesOnOrganizationsUsers < ActiveRecord::Migration[7.1]
  def change
    remove_index(:organizations_users, [:organization_id, :user_id])
    add_index(:organizations_users, [:organization_id, :user_id], unique: true)

    remove_index(:organizations_users, [:user_id, :organization_id])
    add_index(:organizations_users, [:user_id, :organization_id], unique: true)
  end
end
