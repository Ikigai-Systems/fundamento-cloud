# Moves document content out of documents.sync into its own table.
#
# The blob is the Y.js CRDT -- 8.7 KB on average, rewritten on essentially every
# keystroke. Living on the documents row it rode along with every SELECT * and rewrote
# the row plus its TOAST chain on each edit. Postgres already stored it out-of-line, so
# this is not about read speed: it is about the blob no longer being reachable from
# documents at all, and about moving the write churn off a table the command palette
# scans on every search.
#
# Polymorphic because table content is expected to land here too, as `data` -- see
# docs/superpowers/specs/2026-09-09-object-contents-design.md.
#
# documents.sync is left in place; a follow-up migration drops it once this release has
# rolled out.
class CreateObjectContents < ActiveRecord::Migration[8.1]
  def up
    create_table :object_contents do |t|
      t.string :owner_type, null: false
      t.string :owner_id, null: false
      t.binary :sync
      t.jsonb :data
      t.timestamps
    end

    # Makes the relationship 1:1 and gives the lookup its access path.
    add_index :object_contents, [:owner_type, :owner_id], unique: true

    backfill
  end

  def down
    drop_table :object_contents
  end

  private

  # Idempotent: self-hosted runs this during db:prepare on boot, and a retried boot must
  # not duplicate rows. Batched so a large table does not build one enormous transaction.
  # documents.updated_at is carried across so recency ordering survives for documents
  # nobody has edited since.
  def backfill
    last_id = nil

    loop do
      ids = select_values(<<~SQL)
        SELECT id FROM documents
        WHERE sync IS NOT NULL
          #{"AND id > #{quote(last_id)}" if last_id}
        ORDER BY id
        LIMIT 500
      SQL
      break if ids.empty?

      execute(<<~SQL)
        INSERT INTO object_contents (owner_type, owner_id, sync, created_at, updated_at)
        SELECT 'Document', d.id, d.sync, d.created_at, d.updated_at
        FROM documents d
        WHERE d.id IN (#{ids.map { |id| quote(id) }.join(", ")})
          AND NOT EXISTS (
            SELECT 1 FROM object_contents c
            WHERE c.owner_type = 'Document' AND c.owner_id = d.id
          )
      SQL

      last_id = ids.last
    end
  end
end
