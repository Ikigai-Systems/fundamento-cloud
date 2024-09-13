class Version < ApplicationRecord
  belongs_to :document
  acts_as_sequenced scope: :document_id

  belongs_to :created_by, class_name: "User"

  scope :latest, -> { order(updated_at: :desc).limit(1).first }

  # Automatically use the sequential ID in URLs
  def to_param
    self.sequential_id.to_s
  end
end
