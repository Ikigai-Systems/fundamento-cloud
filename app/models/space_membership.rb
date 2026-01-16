class SpaceMembership < ApplicationRecord
  self.primary_key = [:space_id, :member_id, :member_type]

  belongs_to :organization
  belongs_to :space
  belongs_to :member, polymorphic: true

  validates_inclusion_of :member_type, in: %w(OrganizationMembership Team)

  enum :role, [:manager], scope: false

  def display_name
    member.try(:display_name) || member.try(:name)
  end
end