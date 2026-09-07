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

  SUPPORTED_DOCUMENT_FORMATS = %w[markdown docx odt].freeze
  SUPPORTED_ATTACHMENT_FORMATS = %w[image pdf video other].freeze

  # Extensions we can actually turn into a document. Anything absent from this map is stored
  # as a file instead — see .classify.
  DOCUMENT_FORMATS_BY_EXTENSION = {
    ".md" => "markdown",
    ".markdown" => "markdown",
    ".docx" => "docx",
    ".odt" => "odt"
  }.freeze

  ATTACHMENT_FORMATS_BY_EXTENSION = {
    ".png" => "image", ".jpg" => "image", ".jpeg" => "image", ".gif" => "image",
    ".webp" => "image", ".svg" => "image", ".bmp" => "image", ".ico" => "image",
    ".tif" => "image", ".tiff" => "image", ".heic" => "image",
    ".pdf" => "pdf",
    ".mp4" => "video", ".mov" => "video", ".avi" => "video", ".mkv" => "video",
    ".webm" => "video", ".m4v" => "video", ".wmv" => "video", ".flv" => "video"
  }.freeze

  # What a file is, decided from its path. The server owns this: clients report paths, not
  # verdicts. Two uploaders exist — the web UI and fundamento-cli — and they drifted, so
  # `.doc` still arrives from the CLI labelled a document even though Pandoc cannot read
  # DOC and the job can only ever fail on it.
  #
  # The default is deliberately *attachment*. If we cannot convert something into a
  # document, keeping the file is always better than failing the import over it, and it
  # means an unrecognised extension can never produce an "Unsupported document format"
  # failure again.
  def self.classify(relative_path)
    extension = File.extname(relative_path.to_s).downcase

    if (format = DOCUMENT_FORMATS_BY_EXTENSION[extension])
      [:document, format]
    else
      [:attachment, ATTACHMENT_FORMATS_BY_EXTENSION.fetch(extension, "other")]
    end
  end

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
