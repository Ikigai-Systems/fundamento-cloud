class AddSourceNodeIdToObjectReferences < ActiveRecord::Migration[8.1]
  def change
    # Nullable: table-sourced references and pre-existing records may not have a node ID
    add_column :object_references, :source_node_id, :string, null: true

    reversible do |dir|
      dir.up do
        # Populate from existing id (which was the mention node's props.id)
        execute "UPDATE object_references SET source_node_id = id"
      end
    end
  end
end
