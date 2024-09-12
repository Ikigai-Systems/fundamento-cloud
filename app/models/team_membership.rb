class TeamMembership < ApplicationRecord
  self.primary_key = [:team_id, :user_id]

  belongs_to :organization
  belongs_to :team
  belongs_to :user
  belongs_to :space
  belongs_to :member, polymorphic: true
  validates_inclusion_of :member_type, in: %w(OrganizationUser)

  # enum :role, [:manager], scope: false

  def display_name
    member.try(:display_name) || member.try(:name)
  end
end