class CreateInlineCommentThreads < ActiveRecord::Migration[7.1]
  def change
    create_table :inline_comment_threads, id: :string do |t|
      # thread_id -> id

      t.belongs_to :document, null: false, foreign_key: true

      t.timestamps
    end

    create_table :inline_comments, id: :string do |t|
      # comment_id -> id

      t.belongs_to :inline_comment_thread, type: :string
      t.belongs_to :organization_user, null: false, foreign_key: true

      t.string :content

      t.timestamps
    end
  end
end
