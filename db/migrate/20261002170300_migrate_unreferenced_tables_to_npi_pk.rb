# Swaps five integer primary keys for the nanoid-shaped string keys added in the previous
# migration. These five are grouped together because nothing in the database points at them:
# no foreign key targets any of them, so the swap is local to each table.
#
# What *does* hold their ids is audits.auditable_id / associated_id, rewritten here while the old
# id and the new npi are both still present. `audited` is declared on ApplicationRecord, so every
# model is audited unless it calls skip_auditing, and leaving these behind would point each
# model's whole audit trail at ids that no longer exist.
#
# Three of the eight are swapped in their own migrations instead, because each has references
# this shape cannot handle: object_comments (two referencing columns, one undeclared),
# pack_versions (a polymorphic Active Storage reference) and attachments (ids embedded in
# document content, including the binary Yjs state).
class MigrateUnreferencedTablesToNpiPk < ActiveRecord::Migration[8.1]
  # table => the model name `audited` records in audits.auditable_type.
  #
  # The Doorkeeper tables have no model and inherit from ::ActiveRecord::Base rather than
  # ApplicationRecord, so they are never audited; they are listed for completeness, and their
  # sweeps are expected to match nothing.
  TABLES = {
    api_tokens: "ApiToken",
    automation_invocations: "AutomationInvocation",
    oauth_access_grants: "Doorkeeper::AccessGrant",
    oauth_access_tokens: "Doorkeeper::AccessToken",
  }.freeze

  def up
    TABLES.each do |table, audited_type|
      execute <<~SQL
        UPDATE audits
        SET auditable_id = #{table}.npi
        FROM #{table}
        WHERE audits.auditable_type = '#{audited_type}'
          AND audits.auditable_id = #{table}.id::text
      SQL

      execute <<~SQL
        UPDATE audits
        SET associated_id = #{table}.npi
        FROM #{table}
        WHERE audits.associated_type = '#{audited_type}'
          AND audits.associated_id = #{table}.id::text
      SQL
    end

    TABLES.each_key do |table|
      # ADD PRIMARY KEY builds its own unique index, so the one on npi would be redundant on
      # the same column. Dropping it first avoids the leftover the Jan-2026 wave left behind --
      # documents and packs each still carry an index_<table>_on_id alongside their primary key.
      remove_index table, :npi
      remove_column table, :id
      rename_column table, :npi, :id
      execute "ALTER TABLE #{table} ADD PRIMARY KEY (id)"
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
      "Cannot reverse the NPI primary key swap for #{TABLES.keys.join(', ')}. Restore from backup."
  end
end
