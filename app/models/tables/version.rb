# A point-in-time snapshot of a table, created by coalescing a burst of change events.
# The snapshot payload is a gzipped JSON attachment rather than a column: a 50k x 200
# table is 10-20 MB compressed, which does not belong in Postgres. Everything the history
# list renders lives in the metadata columns, so listing never touches the blob.
class Tables::Version < ApplicationRecord
  self.table_name = :table_versions

  include NpiOrdering

  audited enabled: false

  belongs_to :organization
  belongs_to :table
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :restored_from, class_name: "Tables::Version", optional: true

  # Pruning a version discards the window of history it covers, snapshot and log alike.
  # Nullifying instead would leave orphaned events for the next snapshot to mis-claim.
  has_many :change_events, class_name: "Tables::ChangeEvent", dependent: :delete_all

  # Versions produced by restoring this one. Nullified rather than cascaded: pruning or
  # deleting a source version must not take the restore with it, and without this the
  # restored_from foreign key blocks the delete outright.
  has_many :restores, class_name: "Tables::Version", foreign_key: :restored_from_id, dependent: :nullify

  has_one_attached :snapshot

  enum :kind, [:auto, :initial, :restore, :import], scopes: false, validate: true

  # Reading a snapshot parses the whole payload, so a version of a table near the size
  # ceiling cannot be rendered in a request. Restoring it still works -- that path is a
  # deliberate, one-off action rather than something a click on a history link triggers.
  PREVIEWABLE_CELLS = 250_000

  # Retention machinery is built (pinned, kind, TableVersionPruneJob) but deliberately
  # inert: ship keeping everything, enable thinning per deployment once storage numbers
  # from real tables exist.
  RETENTION_POLICY = :keep_all

  scope :chronological, -> { order(sequential_id: :asc) }
  scope :most_recent_first, -> { order(sequential_id: :desc) }

  before_create :set_sequential_id

  # Automatically use the sequential ID in URLs, like Version does for documents.
  def to_param = sequential_id.to_s

  def contributors
    User.where(id: change_events.where.not(actor_id: nil).select(:actor_id))
        .distinct
        .order(:first_name, :last_name)
  end

  def previewable?
    row_count.to_i * column_count.to_i <= PREVIEWABLE_CELLS
  end

  def reader
    @reader ||= Tables::SnapshotReader.new(self)
  end

  # The reader caches the decompressed snapshot, which must not outlive a reload.
  def reload(...)
    @reader = nil
    super
  end

  private

  def set_sequential_id
    # Advisory lock keyed on the table, mirroring Version#set_sequential_id, so
    # concurrent snapshot jobs cannot hand out the same sequential_id.
    lock_key = Zlib.crc32("table_#{table_id}_versions")

    self.class.transaction do
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{lock_key})")
      self.sequential_id = self.class.where(table_id: table_id).maximum(:sequential_id).to_i + 1
    end
  end
end
