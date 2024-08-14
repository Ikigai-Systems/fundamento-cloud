class Document < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  scope :archived, -> { where(archived: true) }
  scope :without_archived, -> { where(archived: false) }

  scope :recently_updated, -> { without_archived.order(updated_at: :desc).limit(50) }

  after_commit :broadcast_recently_updated_documents, on: [:create, :update, :destroy]

  def broadcast_recently_updated_documents
    broadcast_replace_to ["recent_documents_list", self.organization],
      target: "recently_updated_documents_container",
      partial: "documents/recently_updated_documents",
      locals: {
        recently_updated_documents: self.organization.documents.recently_updated,
        current_organization: self.organization
      }
  end
end
