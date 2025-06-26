class DocumentImport < ApplicationRecord
  belongs_to :organization
  belongs_to :space
  belongs_to :organization_user
  belongs_to :document, optional: true

  has_one_attached :file

  validates :file, presence: true
  validate :file_format_supported

  scope :recent, -> { order(created_at: :desc) }
  scope :successful, -> { where.not(document: nil) }
  scope :failed, -> { where(document: nil) }

  def successful?
    document.present?
  end

  def failed?
    document.nil?
  end

  def filename
    file.attached? ? file.filename.to_s : nil
  end

  def file_size
    file.attached? ? file.byte_size : nil
  end

  def content_type
    file.attached? ? file.content_type : nil
  end

  private

  def file_format_supported
    return unless file.attached?

    supported_types = [
      "text/markdown",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
      "application/msword" # .doc
    ]

    unless supported_types.include?(file.content_type)
      errors.add(:file, "format not supported. Supported formats: Markdown (.md), Text (.txt), Word (.docx, .doc)")
    end
  end
end