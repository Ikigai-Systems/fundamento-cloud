class MigrateSpaceToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 0: Drop foreign key constraints from child tables to spaces
    # Note: space_memberships is handled in separate migration (20260104074442)
    remove_foreign_key :documents, :spaces, column: :space_id if foreign_key_exists?(:documents, :spaces, column: :space_id)
    remove_foreign_key :tables, :spaces, column: :space_id if foreign_key_exists?(:tables, :spaces, column: :space_id)
    remove_foreign_key :tags, :spaces, column: :space_id if foreign_key_exists?(:tags, :spaces, column: :space_id)
    remove_foreign_key :automations, :spaces, column: :space_id if foreign_key_exists?(:automations, :spaces, column: :space_id)
    remove_foreign_key :automation_invocations, :spaces, column: :space_id if foreign_key_exists?(:automation_invocations, :spaces, column: :space_id)
    remove_foreign_key :document_imports, :spaces, column: :space_id if foreign_key_exists?(:document_imports, :spaces, column: :space_id)

    # Step 1: Change space_id columns from bigint to string
    change_column :documents, :space_id, :string
    change_column :tables, :space_id, :string
    change_column :tags, :space_id, :string
    change_column :automations, :space_id, :string
    change_column :automation_invocations, :space_id, :string
    change_column :document_imports, :space_id, :string

    # Step 2: Update space_id columns to use NPIs
    execute <<-SQL
      UPDATE documents
      SET space_id = spaces.npi
      FROM spaces
      WHERE documents.space_id::text = spaces.id::text
    SQL

    execute <<-SQL
      UPDATE tables
      SET space_id = spaces.npi
      FROM spaces
      WHERE tables.space_id::text = spaces.id::text
    SQL

    execute <<-SQL
      UPDATE tags
      SET space_id = spaces.npi
      FROM spaces
      WHERE tags.space_id::text = spaces.id::text
    SQL

    execute <<-SQL
      UPDATE automations
      SET space_id = spaces.npi
      FROM spaces
      WHERE automations.space_id::text = spaces.id::text
    SQL

    execute <<-SQL
      UPDATE automation_invocations
      SET space_id = spaces.npi
      FROM spaces
      WHERE automation_invocations.space_id::text = spaces.id::text
    SQL

    execute <<-SQL
      UPDATE document_imports
      SET space_id = spaces.npi
      FROM spaces
      WHERE document_imports.space_id::text = spaces.id::text
    SQL

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :spaces, :id

    # Step 4: Rename npi column to id
    rename_column :spaces, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE spaces ADD PRIMARY KEY (id)"

    # Step 6: Re-add foreign key constraints
    add_foreign_key :documents, :spaces, column: :space_id
    add_foreign_key :tables, :spaces, column: :space_id
    add_foreign_key :tags, :spaces, column: :space_id
    add_foreign_key :automations, :spaces, column: :space_id
    add_foreign_key :automation_invocations, :spaces, column: :space_id
    add_foreign_key :document_imports, :spaces, column: :space_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for spaces"
  end
end
