class ObjectReaction < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_user

  validates_presence_of :emoji
  validates_uniqueness_of :emoji, scope: [:object_id, :object_type, :organization_user_id]
end