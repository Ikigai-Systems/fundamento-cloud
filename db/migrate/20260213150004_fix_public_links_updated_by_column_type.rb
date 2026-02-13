class FixPublicLinksUpdatedByColumnType < ActiveRecord::Migration[8.1]
  def up
    # updated_by_id was created as bigint but stores User NPI string IDs
    # (missed during the NPI migration in 2026-01)
    # Also making nullable to match model's `optional: true`
    remove_index :public_links, :updated_by_id
    change_column :public_links, :updated_by_id, :string, null: true
    add_index :public_links, :updated_by_id

    # Clean up any orphaned references before adding FK
    execute <<-SQL.squish
      UPDATE public_links
      SET updated_by_id = NULL
      WHERE updated_by_id IS NOT NULL
        AND updated_by_id NOT IN (SELECT id FROM users)
    SQL

    add_foreign_key :public_links, :users, column: :updated_by_id
  end

  def down
    remove_foreign_key :public_links, :users, column: :updated_by_id
    remove_index :public_links, :updated_by_id
    change_column :public_links, :updated_by_id, :bigint, null: false
    add_index :public_links, :updated_by_id
  end
end
