class ObjectTag < ApplicationRecord
  ALLOWED_OBJECT_TYPES = %w[Document Table]

  belongs_to :organization
  belongs_to :tag
  belongs_to :object, polymorphic: true

  validates_presence_of :object
  validates :object_type, inclusion: { in: ALLOWED_OBJECT_TYPES }
  
  validates_uniqueness_of :tag_id, scope: [:object_type, :object_id]

  validate :tag_belongs_to_same_space

  private

  def tag_belongs_to_same_space
    return unless tag && object

    if object.respond_to?(:space) && tag.space != object.space
      errors.add(:tag, "must belong to the same space as the tagged object")
    end
  end
end