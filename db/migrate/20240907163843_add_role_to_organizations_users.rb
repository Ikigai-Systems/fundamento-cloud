class AddRoleToOrganizationsUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :organizations_users, :role, :integer, limit: 2, null: false, default: 0
  end
end
