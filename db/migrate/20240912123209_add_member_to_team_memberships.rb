class AddMemberToTeamMemberships < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :team_memberships, :member, polymorphic: true, null: false
    add_index :team_memberships, [:member_id, :member_type, :team_id], unique: true
  end
end
