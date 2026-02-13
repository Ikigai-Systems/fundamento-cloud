class AddSpaceForeignKeyToSpaceMemberships < ActiveRecord::Migration[8.1]
  def up
    # Clean up orphaned records left over from the NPI migration
    execute <<-SQL.squish
      DELETE FROM space_memberships
      WHERE space_id NOT IN (SELECT id FROM spaces)
    SQL

    add_foreign_key :space_memberships, :spaces
  end

  def down
    remove_foreign_key :space_memberships, :spaces
  end
end
