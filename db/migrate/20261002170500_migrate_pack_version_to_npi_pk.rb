# Swaps pack_versions onto its string primary key.
#
# It nearly kept its integer one. PackVersion#set_version_number already assigns `version` as a
# per-pack counter under an advisory lock, so (pack_id, version) was a natural key that only
# needed declaring -- which the first migration in this series does, and which is kept, because a
# pack having two version 3s is wrong regardless of restores.
#
# That would have been enough for a restore to *recognise* a pack version. It was not enough for
# a restore to keep its bundle. active_storage_attachments.record_id is a polymorphic reference
# to whatever a blob hangs off, and with an integer key the restored row's id is reassigned, so
# the attachment was left pointing at an id that no longer existed and the pack's bundle
# silently disappeared. Found by exporting a tenant, restoring it, and exporting again.
#
# Tenant::IdMap cannot express the alternative: its entries are (table, column, target table),
# and a polymorphic column's target depends on record_type. Attachment and Tables::Version --
# the other two things blobs hang off here -- already have string keys, so converting this one
# means nothing polymorphic points at a reassigned id anywhere, and the concept is never needed.
class MigratePackVersionToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # 1. packs.active_version_id -- a real foreign key, and half of a cycle
    #    (packs -> pack_versions -> packs) that Tenant::RestoreOrder::DEFERRED already knows
    #    about. It stays deferred afterwards; only its type changes.
    remove_foreign_key :packs, :pack_versions, column: :active_version_id if
      foreign_key_exists?(:packs, :pack_versions, column: :active_version_id)

    change_column :packs, :active_version_id, :string

    execute <<~SQL
      UPDATE packs
      SET active_version_id = pack_versions.npi
      FROM pack_versions
      WHERE packs.active_version_id = pack_versions.id::text
    SQL

    # 2. The reason this migration exists. Already a string column, holding the integer as text.
    execute <<~SQL
      UPDATE active_storage_attachments
      SET record_id = pack_versions.npi
      FROM pack_versions
      WHERE active_storage_attachments.record_type = 'PackVersion'
        AND active_storage_attachments.record_id = pack_versions.id::text
    SQL

    # 3. The audit trail. PackVersion inherits ApplicationRecord and does not skip_auditing.
    execute <<~SQL
      UPDATE audits
      SET auditable_id = pack_versions.npi
      FROM pack_versions
      WHERE audits.auditable_type = 'PackVersion'
        AND audits.auditable_id = pack_versions.id::text
    SQL

    execute <<~SQL
      UPDATE audits
      SET associated_id = pack_versions.npi
      FROM pack_versions
      WHERE audits.associated_type = 'PackVersion'
        AND audits.associated_id = pack_versions.id::text
    SQL

    remove_index :pack_versions, :npi
    remove_column :pack_versions, :id
    rename_column :pack_versions, :npi, :id
    execute "ALTER TABLE pack_versions ADD PRIMARY KEY (id)"

    add_foreign_key :packs, :pack_versions, column: :active_version_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
      "Cannot reverse the NPI primary key swap for pack_versions. Restore from backup."
  end
end
