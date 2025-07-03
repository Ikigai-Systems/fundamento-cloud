class AddResolvedAtToInlineCommentThread < ActiveRecord::Migration[7.1]
  def change
    add_column :inline_comment_threads, :resolved_at, :datetime
    add_column :inline_comment_threads, :resolved_by, :bigint
  end
end
