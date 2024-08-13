class RemoveOrganizationUserDuplicates < ActiveRecord::Migration[7.1]
  def up
    execute <<-SQL
      WITH duplicates AS (
        SELECT ctid, ROW_NUMBER() OVER(PARTITION BY user_id, organization_id ORDER BY ctid) AS row_number
        FROM organizations_users
      )
      DELETE FROM organizations_users
      WHERE ctid IN (
        SELECT ctid
        FROM duplicates
        WHERE row_number > 1
      );
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end