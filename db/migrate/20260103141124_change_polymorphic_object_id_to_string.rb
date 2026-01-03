class ChangePolymorphicObjectIdToString < ActiveRecord::Migration[8.1]
  def up
    # Change object_id columns in all polymorphic tables from bigint to string
    # This is necessary after migrating Table to use string NPI as primary key

    change_column :favorites, :object_id, :string
    change_column :object_comments, :object_id, :string
    change_column :object_reactions, :object_id, :string
    change_column :object_tags, :object_id, :string
    change_column :object_visitors, :object_id, :string
    change_column :public_links, :object_id, :string
  end

  def down
    # Reversing this is risky - only do it if you're sure all object_ids are integers
    change_column :favorites, :object_id, :bigint, using: 'object_id::bigint'
    change_column :object_comments, :object_id, :bigint, using: 'object_id::bigint'
    change_column :object_reactions, :object_id, :bigint, using: 'object_id::bigint'
    change_column :object_tags, :object_id, :bigint, using: 'object_id::bigint'
    change_column :object_visitors, :object_id, :bigint, using: 'object_id::bigint'
    change_column :public_links, :object_id, :bigint, using: 'object_id::bigint'
  end
end
