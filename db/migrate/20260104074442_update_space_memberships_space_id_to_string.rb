class UpdateSpaceMembershipsSpaceIdToString < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Drop composite primary key (includes space_id)
    execute "ALTER TABLE space_memberships DROP CONSTRAINT IF EXISTS space_memberships_pkey"

    # Step 2: Change space_id from bigint to string
    change_column :space_memberships, :space_id, :string

    # Step 3: Update space_id to match spaces.id (which is already NPIs after Space migration)
    execute <<-SQL
      UPDATE space_memberships
      SET space_id = spaces.id
      FROM spaces
      WHERE space_memberships.space_id::text = spaces.id::text
    SQL

    # Step 4: Re-add composite primary key with string space_id
    execute "ALTER TABLE space_memberships ADD PRIMARY KEY (space_id, member_id, member_type)"
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse space_memberships space_id to string migration"
  end
end
