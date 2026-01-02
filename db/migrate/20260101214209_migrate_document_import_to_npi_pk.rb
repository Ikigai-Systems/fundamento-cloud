class MigrateDocumentImportToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # DocumentImport has no dependent tables, so this is a simple migration

    # Step 1: Drop old id column (drops PK constraint automatically)
    remove_column :document_imports, :id

    # Step 2: Rename npi column to id
    rename_column :document_imports, :npi, :id

    # Step 3: Add primary key constraint on id
    execute "ALTER TABLE document_imports ADD PRIMARY KEY (id)"
  end

  def down
    # Reverse the migration
    execute "ALTER TABLE document_imports DROP CONSTRAINT document_imports_pkey"

    rename_column :document_imports, :id, :npi

    add_column :document_imports, :id, :bigserial, primary_key: true
  end
end
