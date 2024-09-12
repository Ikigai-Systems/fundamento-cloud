class TeamMembership < ApplicationRecord
  self.primary_key = [:team_id, :member_id, :member_type]

  belongs_to :organization
  belongs_to :team
  belongs_to :member, polymorphic: true

  validates_inclusion_of :member_type, in: %w(OrganizationUser)

  # enum :role, [:manager], scope: false

  def display_name
    member.try(:display_name) || member.try(:name)
  end
end