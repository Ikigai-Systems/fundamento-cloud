class ImportFile < ApplicationRecord
  include NpiOrdering

  belongs_to :import_session
  belongs_to :document, optional: true

  has_one_attached :file

  validates :relative_path, presence: true

  enum :file_type, { document: 0, attachment: 1 }

  enum :status, {
    pending: 0,
    uploading: 1,
    uploaded: 2,
    processing: 3,
    completed: 4,
    failed: 5,
    skipped: 6
  }

  SUPPORTED_DOCUMENT_FORMATS = %w[markdown docx odt doc].freeze
  SUPPORTED_ATTACHMENT_FORMATS = %w[image pdf video other].freeze

  scope :needing_upload, -> {
    where.not(status: [statuses[:uploaded], statuses[:completed], statuses[:skipped]])
  }

  def directory_path
    File.dirname(relative_path)
  end

  def filename
    File.basename(relative_path)
  end
end
