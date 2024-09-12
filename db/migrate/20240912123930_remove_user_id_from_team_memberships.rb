class RemoveUserIdFromTeamMemberships < ActiveRecord::Migration[7.1]
  def change
    remove_belongs_to :team_memberships, :user, null: false
  end
end
