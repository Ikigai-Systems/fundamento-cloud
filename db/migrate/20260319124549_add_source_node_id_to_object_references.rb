class AddSourceNodeIdToObjectReferences < ActiveRecord::Migration[8.1]
  def up
    add_column :object_references, :source_node_id, :string

    # Populate from existing id (which was the mention node's props.id)
    execute "UPDATE object_references SET source_node_id = id"

    change_column_null :object_references, :source_node_id, false
  end

  def down
    remove_column :object_references, :source_node_id
  end
end
