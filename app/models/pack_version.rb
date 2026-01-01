class PackVersion < ApplicationRecord
  belongs_to :organization
  belongs_to :pack

  has_one_attached :bundle

  before_create :set_version_number

  private

  def set_version_number
    # Use PostgreSQL advisory lock to prevent race conditions
    # Lock is pack-specific using pack_id as key
    lock_key = Zlib.crc32("pack_#{pack_id}_versions")

    self.class.transaction do
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{lock_key})")
      self.version = pack.versions.maximum(:version).to_i + 1
    end
  end
end
