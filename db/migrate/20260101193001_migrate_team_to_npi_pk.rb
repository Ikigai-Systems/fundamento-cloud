class MigrateTeamToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # STEP 2 of Team migration: Migrate Team to use NPI as primary key
    # Requires previous migration (PrepareSpaceMembershipsForTeamMigration)

    # Step 1: Drop foreign key from team_memberships to teams
    remove_foreign_key :team_memberships, :teams if foreign_key_exists?(:team_memberships, :teams)

    # Step 2: Update team_memberships.team_id to string type (no limit to match PK)
    change_column :team_memberships, :team_id, :string

    # Step 3: Copy NPI values to team_memberships.team_id
    execute <<-SQL
      UPDATE team_memberships
      SET team_id = teams.npi
      FROM teams
      WHERE team_memberships.team_id = teams.id::text
    SQL

    # Step 4: Update space_memberships.member_id for Team references
    # Convert old integer Team IDs (now strings) to Team NPIs
    execute <<-SQL
      UPDATE space_memberships
      SET member_id = teams.npi
      FROM teams
      WHERE space_memberships.member_type = 'Team'
        AND space_memberships.member_id = teams.id::text
    SQL

    # Step 5: Drop the old id column from teams (drops PK constraint automatically)
    remove_column :teams, :id

    # Step 6: Rename npi column to id
    rename_column :teams, :npi, :id

    # Step 7: Add primary key constraint on id
    execute "ALTER TABLE teams ADD PRIMARY KEY (id)"

    # Step 8: Re-add foreign key
    add_foreign_key :team_memberships, :teams, column: :team_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse Team to NPI primary key migration. Restore from backup if needed."
  end
end
