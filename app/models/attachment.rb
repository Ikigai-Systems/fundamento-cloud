class Attachment < ApplicationRecord
  include NpiOrdering

  belongs_to :organization
  belongs_to :parent, polymorphic: true

  # Active Storage association for migrating from database storage
  has_one_attached :file

  # True while the stable-identity rewrite is part-way through: npi holds what will become the
  # primary key, and `id` is still the integer.
  def self.in_transition? = column_names.include?("npi")

  # Resolves an attachment by whichever identifier the document happens to hold.
  #
  # Content and ids cannot flip in one step. The rewrite commits as it goes so that an
  # interruption can be resumed rather than redone, which means that for its duration one
  # document may reference the integer id it was written with and the next may reference the
  # npi. Both have to resolve, or half the documents show broken attachments until the rewrite
  # finishes.
  #
  # Collapses back to a plain lookup once npi has been dropped.
  def self.resolve!(param, scope: all)
    return scope.find(param) unless in_transition?

    scope.where(id: param).or(scope.where(npi: param)).first ||
      raise(ActiveRecord::RecordNotFound, "Couldn't find Attachment with id or npi #{param.inspect}")
  end


  # Where to send a browser for this attachment's file, named after the attachment rather than
  # its blob. One blob can back several attachments: an import shares its upload's blob with the
  # Attachment it creates, and a blob reused by content keeps the name it was first uploaded
  # under, so naming the download after the blob could show one member another's filename.
  #
  # Active Storage still forces `attachment` disposition for types unsafe to render inline.
  def download_url(disposition: "inline")
    file.blob.url(disposition: disposition, filename: filename.presence || file.filename)
  end

  # Helper method to check which storage is being used
  def stored_in_active_storage?
    file.attached?
  end

  def stored_in_database?
    data.present?
  end
end
