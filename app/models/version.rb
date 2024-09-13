class Version < ApplicationRecord
  belongs_to :document
  acts_as_sequenced scope: :document_id

  scope :latest, -> { order(updated_at: :desc).limit(1).first }

  # Automatically use the sequential ID in URLs
  def to_param
    self.sequential_id.to_s
  end
end
