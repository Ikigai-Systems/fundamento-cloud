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
  # the content changed since (see DocumentService#update!).
  #
  # The increment is part of the UPDATE that writes the blob (`sync_version = sync_version + 1`,
  # see #_update_row), so two writers that loaded the same row both count. Unlike Rails'
  # optimistic locking it never refuses a write: Yjs states merge, so a stale copy is still a
  # valid write. The in-memory value after a save is a prediction (the one that was loaded, plus
  # one); it is exact only when the row was locked (`lock!`) since the load, as the check in
  # DocumentService#update! does. Reload for the stored value.
  before_save :bump_sync_version, if: :will_save_change_to_sync?

  private

  def bump_sync_version
    self.sync_version = new_record? ? 1 : sync_version_was.to_i + 1
  end

  # Writes the new version as SQL in the same UPDATE as the blob. Rails offers no public way to
  # assign an expression to an attribute (an Arel node is cast to an integer), so this overrides
  # the private hook Rails' own optimistic locking uses; the specs here pin the behaviour across
  # Rails upgrades.
  def _update_row(attribute_names, attempted_action = "update")
    return super unless will_save_change_to_sync?
    values = attributes_with_values(attribute_names - ["sync_version"])
    values["sync_version"] = self.class.arel_table[:sync_version] + 1
    self.class._update_record(values, _query_constraints_hash)
  end
end
