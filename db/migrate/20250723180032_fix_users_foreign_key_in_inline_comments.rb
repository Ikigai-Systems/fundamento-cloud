class FixUsersForeignKeyInInlineComments < ActiveRecord::Migration[7.1]
  def change
    remove_foreign_key :inline_comments, :organization_users
    add_foreign_key :inline_comments, :users, column: :user_id
  end
end
