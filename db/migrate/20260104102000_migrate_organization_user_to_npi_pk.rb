class MigrateOrganizationUserToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # List of all tables with organization_user_id or run_as_id FK
    tables_with_org_user_id = [
      { table: :api_tokens, column: :organization_user_id },
      { table: :document_imports, column: :organization_user_id },
      { table: :favorites, column: :organization_user_id },
      { table: :object_comments, column: :organization_user_id },
      { table: :object_reactions, column: :organization_user_id },
      { table: :organization_user_properties, column: :organization_user_id },
      { table: :automations, column: :run_as_id },
      { table: :automation_invocations, column: :run_as_id }
    ]

    # Step 0: Drop foreign key constraints from child tables to organization_users
    tables_with_org_user_id.each do |entry|
      if foreign_key_exists?(entry[:table], :organization_users, column: entry[:column])
        remove_foreign_key entry[:table], :organization_users, column: entry[:column]
      end
    end

    # Step 1: Change organization_user_id/run_as_id columns from bigint to string
    tables_with_org_user_id.each do |entry|
      change_column entry[:table], entry[:column], :string
    end

    # Step 2: Update organization_user_id/run_as_id columns to use NPIs
    tables_with_org_user_id.each do |entry|
      execute <<-SQL
        UPDATE #{entry[:table]}
        SET #{entry[:column]} = organization_users.npi
        FROM organization_users
        WHERE #{entry[:table]}.#{entry[:column]}::text = organization_users.id::text
      SQL
    end

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :organization_users, :id

    # Step 4: Rename npi column to id
    rename_column :organization_users, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE organization_users ADD PRIMARY KEY (id)"

    # Step 6: Re-add foreign key constraints
    tables_with_org_user_id.each do |entry|
      add_foreign_key entry[:table], :organization_users, column: entry[:column]
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for organization_users"
  end
end
