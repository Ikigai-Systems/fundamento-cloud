# One entry in a table's append-only change log, written in the same transaction as the
# mutation it describes. Events are claimed by a Tables::Version when the coalescing job
# rolls a burst of edits into a snapshot; until then they are "unlinked".
class Tables::ChangeEvent < ApplicationRecord
  self.table_name = :table_change_events

  # This model *is* the audit log. Auditing it would be circular.
  audited enabled: false

  belongs_to :organization
  belongs_to :table
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :version, class_name: "Tables::Version", optional: true

  enum :kind, [
    :cell_updated,
    :row_inserted,
    :row_deleted,
    :row_moved,
    :column_added,
    :column_removed,
    :column_renamed,
    :column_retyped,
    :column_reconfigured,
    :column_moved,
    :bulk_imported,
    :restored,
  ], scopes: false, validate: true

  validates :source, inclusion: { in: Current::SOURCES }

  scope :unlinked, -> { where(version: nil) }
  scope :chronological, -> { order(:id) }

  STRUCTURAL_KINDS = %w[
    column_added column_removed column_renamed column_retyped column_reconfigured column_moved
  ].freeze

  def structural? = STRUCTURAL_KINDS.include?(kind)
end
