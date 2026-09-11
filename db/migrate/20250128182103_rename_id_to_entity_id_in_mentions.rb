# One-off January 2025 backfill that rewrote mention props from "id" to "entityId".
# It ran through versions:rename_mentions_id_to_entity_id, a rake task that read
# versions.content — a column that no longer exists — so the task could no longer
# run and has been removed. Kept as a no-op to preserve the migration timeline.
class RenameIdToEntityIdInMentions < ActiveRecord::Migration[7.1]
  def change
  end
end
