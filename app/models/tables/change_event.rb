# One entry in a table's append-only change log, written in the same transaction as the
# mutation it describes. Events are claimed by a Tables::Version when the coalescing job
# rolls a burst of edits into a snapshot; until then they are "unlinked".
class Tables::ChangeEvent < ApplicationRecord
  self.table_name = :table_change_events

  # This model *is* the audit log. Auditing it would be circular.
  skip_auditing

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

  # Ordered by the per-table counter rather than by id. `id` comes from a sequence shared
  # across every tenant, so a restored event would be reassigned a fresh value and sort last
  # no matter when it happened; sequential_id is carried across an archive verbatim.
  scope :chronological, -> { order(:sequential_id) }

  before_create :set_sequential_id

  STRUCTURAL_KINDS = %w[
    column_added column_removed column_renamed column_retyped column_reconfigured column_moved
  ].freeze

  def structural? = STRUCTURAL_KINDS.include?(kind)

  private

  def set_sequential_id
    # Advisory lock keyed on the table, mirroring Tables::Version#set_sequential_id. Beyond
    # handing out a unique number it serialises appends to one table's log, which is what
    # Tables::ChangeRecorder#coalescable_event already assumes when it calls the row it finds
    # "strictly the immediately preceding event" -- without this, two writers could both
    # coalesce into the same one.
    #
    # Keyed separately from the snapshot counter so change events and version snapshots do not
    # wait on each other.
    lock_key = Zlib.crc32("table_#{table_id}_change_events")

    self.class.transaction do
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{lock_key})")
      self.sequential_id = self.class.where(table_id: table_id).maximum(:sequential_id).to_i + 1
    end
  end
end
