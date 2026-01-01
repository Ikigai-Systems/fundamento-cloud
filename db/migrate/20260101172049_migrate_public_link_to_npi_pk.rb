class MigratePublicLinkToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # PublicLink has no foreign keys pointing to it, so this is very simple!

    # Step 1: Drop the old id column (drops PK constraint automatically)
    remove_column :public_links, :id

    # Step 2: Rename npi column to id
    rename_column :public_links, :npi, :id

    # Step 3: Add primary key constraint on id
    execute "ALTER TABLE public_links ADD PRIMARY KEY (id)"
  end

  def down
    # This is a destructive migration - rollback requires restore from backup
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse PublicLink to NPI primary key migration. Restore from backup if needed."
  end
end
