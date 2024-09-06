class CreateTeamMemberships < ActiveRecord::Migration[7.1]
  def change
    create_table :team_memberships do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :team, null: false, foreign_key: true
      t.belongs_to :user, null: false, foreign_key: true

      t.timestamps

      t.index [:team_id, :user_id], unique: true
    end
  end
end
