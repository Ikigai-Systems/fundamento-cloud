class FixTeamMembershipsMemberIdForOrganizationUser < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Change member_id from bigint to string (affects all member types)
    change_column :team_memberships, :member_id, :string

    # Step 2: Update member_id to use NPIs for OrganizationUser members
    execute <<-SQL
      UPDATE team_memberships
      SET member_id = organization_users.id
      FROM organization_users
      WHERE team_memberships.member_type = 'OrganizationUser'
        AND team_memberships.member_id::text = organization_users.id::text
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse member_id type change for team_memberships"
  end
end
