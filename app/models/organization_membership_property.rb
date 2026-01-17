class OrganizationMembershipProperty < ApplicationRecord
  belongs_to :organization_membership
  has_one :organization, through: :organization_membership

  validates_uniqueness_of :key, scope: [:organization_membership_id]

  # scope :with_key, -> (key) = { where("key ") }
end