# Packs were removed from the code earlier; this drops what they left in the database.
class DropPacks < ActiveRecord::Migration[8.1]
  def up
    # Pack versions held their bundle through Active Storage. Drop those attachment rows and
    # purge the blobs nothing else uses: purge_later deletes the stored file in a job, so the
    # migration doesn't wait on storage.
    blob_ids = select_values(
      "SELECT blob_id FROM active_storage_attachments WHERE record_type = 'PackVersion'"
    )
    execute "DELETE FROM active_storage_attachments WHERE record_type = 'PackVersion'"
    ActiveStorage::Blob.where(id: blob_ids).where.missing(:attachments).find_each(&:purge_later)

    # packs.active_version_id and pack_versions.pack_id point at each other.
    remove_foreign_key :packs, :pack_versions, column: :active_version_id
    drop_table :pack_versions
    drop_table :packs
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
