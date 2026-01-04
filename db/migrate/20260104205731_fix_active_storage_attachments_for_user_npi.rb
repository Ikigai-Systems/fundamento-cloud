class FixActiveStorageAttachmentsForUserNpi < ActiveRecord::Migration[8.1]
  def up
    # Change record_id from bigint to string to support string primary keys
    change_column :active_storage_attachments, :record_id, :string
  end

  def down
    # Cannot safely reverse - would need to convert NPIs back to numeric IDs
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse active_storage_attachments NPI migration"
  end
end
