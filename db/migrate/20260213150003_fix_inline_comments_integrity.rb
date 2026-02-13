class FixInlineCommentsIntegrity < ActiveRecord::Migration[8.1]
  def up
    # resolved_by was created as bigint but stores User NPI string IDs
    # (missed during the NPI migration in 2026-01)
    change_column :inline_comment_threads, :resolved_by, :string

    # Clean up any orphaned references before adding FK
    execute <<-SQL.squish
      UPDATE inline_comment_threads
      SET resolved_by = NULL
      WHERE resolved_by IS NOT NULL
        AND resolved_by NOT IN (SELECT id FROM users)
    SQL

    add_foreign_key :inline_comment_threads, :users, column: :resolved_by
    add_foreign_key :inline_comments, :inline_comment_threads
  end

  def down
    remove_foreign_key :inline_comments, :inline_comment_threads
    remove_foreign_key :inline_comment_threads, :users, column: :resolved_by
    change_column :inline_comment_threads, :resolved_by, :bigint
  end
end
