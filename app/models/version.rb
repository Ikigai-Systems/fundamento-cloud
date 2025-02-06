class Version < ApplicationRecord
  belongs_to :document
  acts_as_sequenced scope: :document_id

  belongs_to :created_by, class_name: "User", optional: true

  scope :latest, -> { order(updated_at: :desc).first }

  after_commit :broadcast_mentions_updated, on: [:create, :update, :destroy] # does :update make sense here? [STE 30-01-2025]

  def broadcast_mentions_updated
    broadcast_refresh_to ["mentions_list", self.document.organization]
  end

  # Automatically use the sequential ID in URLs
  def to_param
    self.sequential_id.to_s
  end
end
