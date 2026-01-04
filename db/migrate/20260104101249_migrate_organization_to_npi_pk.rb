class MigrateOrganizationToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # List of all tables with organization_id FK
    tables_with_org_id = [
      :api_tokens,
      :attachments,
      :automation_invocations,
      :automations,
      :document_imports,
      :documents,
      :invited_users,
      :object_comments,
      :object_reactions,
      :object_tags,
      :organization_users,
      :pack_versions,
      :packs,
      :public_links,
      :space_memberships,
      :spaces,
      :table_cells,
      :table_columns,
      :table_rows,
      :tables,
      :tags,
      :team_memberships,
      :teams
    ]

    # Step 0: Drop foreign key constraints from child tables to organizations
    tables_with_org_id.each do |table|
      if foreign_key_exists?(table, :organizations, column: :organization_id)
        remove_foreign_key table, :organizations, column: :organization_id
      end
    end

    # Step 1: Change organization_id columns from bigint to string
    tables_with_org_id.each do |table|
      change_column table, :organization_id, :string
    end

    # Step 2: Update organization_id columns to use NPIs
    tables_with_org_id.each do |table|
      execute <<-SQL
        UPDATE #{table}
        SET organization_id = organizations.npi
        FROM organizations
        WHERE #{table}.organization_id::text = organizations.id::text
      SQL
    end

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :organizations, :id

    # Step 4: Rename npi column to id
    rename_column :organizations, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE organizations ADD PRIMARY KEY (id)"

    # Step 6: Re-add foreign key constraints
    tables_with_org_id.each do |table|
      add_foreign_key table, :organizations, column: :organization_id
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for organizations"
  end
end
