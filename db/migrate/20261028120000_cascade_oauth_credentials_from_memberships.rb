# OAuth grants and tokens reach their organization through organization_membership_id, which had
# no foreign key, so removing a member left their credentials behind for good. They could no
# longer authenticate, but the owner could not see or revoke them and refresh tokens kept minting
# new ones.
#
# Rows already pointing at a removed membership are deleted first: the constraint cannot be added
# while they exist, and they are unusable anyway. Rows with no membership at all are left alone;
# the constraint does not cover NULL.
class CascadeOauthCredentialsFromMemberships < ActiveRecord::Migration[8.1]
  TABLES = %i[oauth_access_grants oauth_access_tokens].freeze

  def up
    TABLES.each do |table|
      execute <<~SQL
        DELETE FROM #{table}
        WHERE organization_membership_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM organization_memberships m WHERE m.id = #{table}.organization_membership_id)
      SQL

      add_foreign_key table, :organization_memberships, on_delete: :cascade
    end
  end

  def down
    TABLES.each { |table| remove_foreign_key table, :organization_memberships }
  end
end
