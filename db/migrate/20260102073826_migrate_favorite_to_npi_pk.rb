class MigrateFavoriteToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Favorite has no dependent tables, so this is a simple migration

    # Step 1: Drop old id column (drops PK constraint automatically)
    remove_column :favorites, :id

    # Step 2: Rename npi column to id
    rename_column :favorites, :npi, :id

    # Step 3: Add primary key constraint on id
    execute "ALTER TABLE favorites ADD PRIMARY KEY (id)"
  end

  def down
    # Reverse the migration
    execute "ALTER TABLE favorites DROP CONSTRAINT favorites_pkey"

    rename_column :favorites, :id, :npi

    add_column :favorites, :id, :bigserial, primary_key: true
  end
end
