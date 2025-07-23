class RenameOrganizationUsersToUsersInInlineComments < ActiveRecord::Migration[7.1]
  def change
    rename_column :inline_comments, :organization_user_id, :user_id
  end
end
