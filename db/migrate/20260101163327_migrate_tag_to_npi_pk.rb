class MigrateTagToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Drop foreign key from object_tags to tags
    if foreign_key_exists?(:object_tags, :tags)
      remove_foreign_key :object_tags, :tags
    end

    # Step 2: Update object_tags.tag_id to string type
    change_column :object_tags, :tag_id, :string, limit: 10

    # Step 3: Copy NPI values to FK column
    execute <<-SQL
      UPDATE object_tags
      SET tag_id = tags.npi
      FROM tags
      WHERE object_tags.tag_id::text = tags.id::text
    SQL

    # Step 4: Drop the old id column (drops PK constraint automatically)
    remove_column :tags, :id

    # Step 5: Rename npi column to id
    rename_column :tags, :npi, :id

    # Step 6: Add primary key constraint on id
    execute "ALTER TABLE tags ADD PRIMARY KEY (id)"

    # Step 7: Re-add foreign key
    add_foreign_key :object_tags, :tags, column: :tag_id
  end

  def down
    # This is a destructive migration - rollback requires restore from backup
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse Tag to NPI primary key migration. Restore from backup if needed."
  end
end
