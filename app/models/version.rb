class Version < ApplicationRecord
  belongs_to :document
  acts_as_sequenced scope: :document_id

  # Automatically use the sequential ID in URLs
  def to_param
    self.sequential_id.to_s
  end
end
