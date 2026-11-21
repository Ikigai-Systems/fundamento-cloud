# The content of a document or -- later -- a table, kept off the owner's row.
#
# `sync` holds a document's Y.js CRDT blob. `data` is reserved for table content once it
# moves from tables/rows + columns + cells to JSON.
class ObjectContent < ApplicationRecord
  # The blob is rewritten on essentially every keystroke, and an audit row per write would
  # store a copy of every version of every document.
  skip_auditing

  # touch: is load-bearing. Content writes no longer reach the owner's row, and
  # Document.recently_updated -- the dashboard's "Recently updated" frame -- plus
  # TitleSearch's recency tiebreak both order by documents.updated_at. Without this they
  # would silently stop reflecting edits. updated_at is unindexed, so the touch is a HOT
  # update rather than another blob rewrite.
  belongs_to :owner, polymorphic: true, touch: true

  # Moves on every write of the Yjs state, whoever makes it: a keystroke in an editor, an
  # import, the API or an assistant. A client that read version N and finds a higher one knows
  # the content changed since (see DocumentService#update!). The increment happens in the
  # database, so two writers that loaded the same row still end on two different versions.
  after_save :bump_sync_version, if: :saved_change_to_sync?

  private

  def bump_sync_version
    version = self.class.connection.select_value(
      self.class.sanitize_sql_array(
        ["UPDATE object_contents SET sync_version = sync_version + 1 WHERE id = ? RETURNING sync_version", id]
      )
    )
    # Reflect it on this instance without marking the attribute as changed.
    self[:sync_version] = version
    clear_attribute_changes([:sync_version])
  end
end
