class InsertToOrganizationUsers < ActiveRecord::Migration[7.1]
  def up
    execute <<-SQL
    INSERT INTO organization_users (organization_id, user_id, role, created_at, updated_at)
      SELECT organization_id, user_id, role, NOW(), NOW()
      FROM organizations_users;
    SQL
  end

  def down
    execute <<-SQL
    DELETE FROM organization_users;
    SQL
  end
end
