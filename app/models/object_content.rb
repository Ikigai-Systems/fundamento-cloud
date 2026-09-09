# The content of a document or -- later -- a table, kept off the owner's row.
#
# `sync` holds a document's Y.js CRDT blob. `data` is reserved for table content once it
# moves from tables/rows + columns + cells to JSON. See
# docs/superpowers/specs/2026-09-09-object-contents-design.md.
class ObjectContent < ApplicationRecord
  # ApplicationRecord calls `audited`, so every model is audited by default and this one
  # has to opt out: the blob is rewritten on essentially every keystroke, and an audit row
  # per write would store a copy of every version of every document.
  #
  # NOT `audited enabled: false` -- that reads as an opt-out but is a no-op in audited
  # 5.8.0: set_audited_options never looks at :enabled, and auditing_enabled is driven by
  # Audited.store instead. Six other models in this app carry that same dead declaration.
  # Overriding the class method is what write_audit actually consults.
  def self.auditing_enabled = false

  # touch: is load-bearing. Content writes no longer reach the owner's row, and
  # Document.recently_updated -- the dashboard's "Recently updated" frame -- plus
  # TitleSearch's recency tiebreak both order by documents.updated_at. Without this they
  # would silently stop reflecting edits. updated_at is unindexed, so the touch is a HOT
  # update rather than another blob rewrite.
  belongs_to :owner, polymorphic: true, touch: true
end
