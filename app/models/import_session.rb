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

  def increment_counter!(counter)
    self.class.where(id: id).update_all("#{counter} = #{counter} + 1")
    reload
  end

  def merge_path_map!(relative_path, object_id)
    self.class.where(id: id).update_all(
      ["path_map = path_map || ?::jsonb", { relative_path => object_id }.to_json]
    )
  end

  private

  def set_expires_at
    self.expires_at ||= 7.days.from_now
  end
end
