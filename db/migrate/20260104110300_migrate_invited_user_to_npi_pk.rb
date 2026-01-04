class MigrateInvitedUserToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # InvitedUser has no child tables, so this is simpler

    # Step 1: Drop the old id column (drops PK constraint automatically)
    remove_column :invited_users, :id

    # Step 2: Rename npi column to id
    rename_column :invited_users, :npi, :id

    # Step 3: Add primary key constraint on id
    execute "ALTER TABLE invited_users ADD PRIMARY KEY (id)"
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for invited_users"
  end
end
