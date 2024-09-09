class AddRoleToSpaceMemberships < ActiveRecord::Migration[7.1]
  def change
    add_column :space_memberships, :role, :integer, limit: 2, null: false, default: 0
  end
end
