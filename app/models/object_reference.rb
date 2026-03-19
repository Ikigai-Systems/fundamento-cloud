class ObjectReference < ApplicationRecord
  ALLOWED_SOURCE_TYPES = %w[Document Table].freeze
  ALLOWED_TARGET_TYPES = %w[Document Table User].freeze

  belongs_to :organization
  belongs_to :source, polymorphic: true

  validates :source_type, presence: true, inclusion: { in: ALLOWED_SOURCE_TYPES }
  validates :source_id, presence: true
  validates :target_type, presence: true, inclusion: { in: ALLOWED_TARGET_TYPES }
  validates :title, presence: true

  scope :current, -> { where(current: true) }
  scope :broken, -> { where(target_id: nil) }
  scope :for_source, ->(source) { where(source_type: source.class.name, source_id: source.id) }
  scope :pointing_to, ->(target_type, target_id) { where(target_type: target_type, target_id: target_id) }

  def broken?
    target_id.nil?
  end
end
