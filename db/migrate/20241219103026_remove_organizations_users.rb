class RemoveOrganizationsUsers < ActiveRecord::Migration[7.1]
  def change
    drop_table :organizations_users
  end
end
