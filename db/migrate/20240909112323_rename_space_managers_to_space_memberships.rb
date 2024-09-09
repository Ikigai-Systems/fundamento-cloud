class RenameSpaceManagersToSpaceMemberships < ActiveRecord::Migration[7.1]
  def change
    rename_table :space_managers, :space_memberships
    rename_column :space_memberships, :manager_type, :member_type
    rename_column :space_memberships, :manager_id, :member_id
  end
end
