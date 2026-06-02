class ImportSession < ApplicationRecord
  include NpiOrdering

  belongs_to :organization
  belongs_to :space
  belongs_to :organization_membership
  has_many :import_files, dependent: :destroy

  enum :status, {
    pending: 0,
    uploading: 1,
    processing: 2,
    completed: 3,
    failed: 4,
    partial: 5
  }

  enum :source_format, {
    generic: "generic",
    obsidian: "obsidian"
  }

  scope :recent, -> { order(created_at: :desc) }
  scope :expired, -> {
    where(status: [statuses[:pending], statuses[:uploading]])
      .where("expires_at < ?", Time.current)
  }

  before_create :set_expires_at

  def all_files_uploaded?
    import_files.where.not(status: ImportFile.statuses.slice(:uploaded, :completed, :skipped).values).none?
  end

  def total_files    = import_files.count
  def uploaded_files = status_count(:uploaded)
  def processed_files = status_count(:completed)
  def failed_files   = status_count(:failed)
  def skipped_files  = status_count(:skipped)

  def preload_status_counts(counts_by_session_and_status)
    @preloaded_counts = counts_by_session_and_status
  end

  def merge_path_map!(relative_path, object_id)
    self.class.where(id: id).update_all(
      ["path_map = path_map || ?::jsonb", { relative_path => object_id }.to_json]
    )
  end

  private

  def status_count(status_key)
    if @preloaded_counts
      @preloaded_counts.fetch([id, ImportFile.statuses[status_key]], 0)
    else
      import_files.where(status: status_key).count
    end
  end

  def set_expires_at
    self.expires_at ||= 7.days.from_now
  end
end
