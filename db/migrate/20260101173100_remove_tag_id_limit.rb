class RemoveTagIdLimit < ActiveRecord::Migration[8.1]
  def up
    # Remove limit from object_tags.tag_id to match tags.id (which has no limit)
    change_column :object_tags, :tag_id, :string, limit: nil
  end

  def down
    # Re-add limit if needed to rollback
    change_column :object_tags, :tag_id, :string, limit: 10
  end
end
