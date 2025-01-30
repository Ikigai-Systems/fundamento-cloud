class OrganizationUserProperty < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_user

  validates_uniqueness_of :key, scope: [:organization_user_id]

  # scope :with_key, -> (key) = { where("key ") }
end