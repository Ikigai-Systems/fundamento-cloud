class Document < ApplicationRecord
  belongs_to :organization
  # belongs_to :space #todo: we need first to allocatate db column for that

  scope :recently_updated, -> { order(updated_at: :desc) }
end
