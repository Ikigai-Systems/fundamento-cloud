class RenameOrganizationUserToOrganizationMembership < ActiveRecord::Migration[8.1]
  def up
    # Rename main table
    rename_table :organization_users, :organization_memberships

    # Rename related table
    rename_table :organization_user_properties, :organization_membership_properties

    # Rename foreign key columns in dependent tables
    rename_column :api_tokens, :organization_users_id, :organization_membership_id
    rename_column :favorites, :organization_users_id, :organization_membership_id
    rename_column :object_reactions, :organization_users_id, :organization_membership_id
    rename_column :object_comments, :organization_users_id, :organization_membership_id
    rename_column :document_imports, :organization_users_id, :organization_membership_id
    rename_column :organization_membership_properties, :organization_users_id, :organization_membership_id

    # Update polymorphic type strings in space_memberships
    execute <<-SQL
      UPDATE space_memberships
      SET member_type = 'OrganizationMembership'
      WHERE member_type = 'OrganizationUser';
    SQL

    # Update polymorphic type strings in team_memberships
    execute <<-SQL
      UPDATE team_memberships
      SET member_type = 'OrganizationMembership'
      WHERE member_type = 'OrganizationUser';
    SQL
  end

  def down
    # Rollback polymorphic type strings in team_memberships
    execute <<-SQL
      UPDATE team_memberships
      SET member_type = 'OrganizationUser'
      WHERE member_type = 'OrganizationMembership';
    SQL

    # Rollback polymorphic type strings in space_memberships
    execute <<-SQL
      UPDATE space_memberships
      SET member_type = 'OrganizationUser'
      WHERE member_type = 'OrganizationMembership';
    SQL

    # Rollback foreign key column renames
    rename_column :organization_membership_properties, :organization_membership_id, :organization_users_id
    rename_column :document_imports, :organization_membership_id, :organization_users_id
    rename_column :object_comments, :organization_membership_id, :organization_users_id
    rename_column :object_reactions, :organization_membership_id, :organization_users_id
    rename_column :favorites, :organization_membership_id, :organization_users_id
    rename_column :api_tokens, :organization_membership_id, :organization_users_id

    # Rollback related table rename
    rename_table :organization_membership_properties, :organization_user_properties

    # Rollback main table rename
    rename_table :organization_memberships, :organization_users
  end
end
