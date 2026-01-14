class FixInvitedUsersForUserNpi < ActiveRecord::Migration[8.1]
  def up
    # Change record_id from bigint to string to support string primary keys
    change_column :invited_users, :invited_by_id, :string
  end

  def down
    # Cannot safely reverse - would need to convert NPIs back to numeric IDs
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse invited_users NPI migration"
  end
end
