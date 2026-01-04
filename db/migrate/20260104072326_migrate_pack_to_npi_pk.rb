class MigratePackToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 0: Drop foreign key constraint from pack_versions to packs
    remove_foreign_key :pack_versions, :packs, column: :pack_id if foreign_key_exists?(:pack_versions, :packs, column: :pack_id)

    # Step 1: Change pack_id in pack_versions from bigint to string
    change_column :pack_versions, :pack_id, :string

    # Step 2: Update pack_versions.pack_id to use NPIs
    execute <<-SQL
      UPDATE pack_versions
      SET pack_id = packs.npi
      FROM packs
      WHERE pack_versions.pack_id::text = packs.id::text
    SQL

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :packs, :id

    # Step 4: Rename npi column to id
    rename_column :packs, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE packs ADD PRIMARY KEY (id)"

    # Step 6: Re-add foreign key constraint
    add_foreign_key :pack_versions, :packs, column: :pack_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for packs"
  end
end
