class PrepareSpaceMembershipsForTeamMigration < ActiveRecord::Migration[8.1]
  def up
    # STEP 1 of Team migration: Prepare space_memberships for polymorphic string IDs
    # This must run BEFORE migrating Team to support references to both:
    # - Team (will use string NPIs)
    # - OrganizationUser (uses bigint, converted to string for consistency)

    # Change member_id from bigint to string
    change_column :space_memberships, :member_id, :string, using: 'member_id::text'
  end

  def down
    # Can only safely convert back if no Team references exist
    change_column :space_memberships, :member_id, :bigint, using: 'CAST(member_id AS bigint)'
  end
end
