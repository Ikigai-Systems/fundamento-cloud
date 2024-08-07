class Document < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  scope :recently_updated, -> { order(updated_at: :desc) }
end
