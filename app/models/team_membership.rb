class TeamMembership < ApplicationRecord
  self.primary_key = [:team_id, :user_id]

  belongs_to :organization
  belongs_to :team
  belongs_to :user
end