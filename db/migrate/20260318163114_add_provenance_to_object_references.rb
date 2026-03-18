class AddProvenanceToObjectReferences < ActiveRecord::Migration[8.1]
  def change
    # bigint to match versions.id (default Rails bigint PK)
    add_column :object_references, :source_version_id, :bigint, null: true
    # bigint to match object_comments.id (default Rails bigint PK)
    add_column :object_references, :source_comment_id, :bigint, null: true

    add_index :object_references, :source_version_id, where: "source_version_id IS NOT NULL"
    add_index :object_references, :source_comment_id, where: "source_comment_id IS NOT NULL"
  end
end
