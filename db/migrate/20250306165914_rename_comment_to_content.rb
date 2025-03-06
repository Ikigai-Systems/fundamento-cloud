class RenameCommentToContent < ActiveRecord::Migration[7.1]
  def change
    rename_column :object_comments, :comment, :content
  end
end
