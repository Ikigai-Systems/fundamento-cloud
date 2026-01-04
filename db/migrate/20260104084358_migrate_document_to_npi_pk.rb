class MigrateDocumentToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 0: Drop foreign key constraints from child tables to documents
    remove_foreign_key :document_imports, :documents, column: :document_id if foreign_key_exists?(:document_imports, :documents, column: :document_id)
    remove_foreign_key :inline_comment_threads, :documents, column: :document_id if foreign_key_exists?(:inline_comment_threads, :documents, column: :document_id)
    remove_foreign_key :spaces, :documents, column: :home_document_id if foreign_key_exists?(:spaces, :documents, column: :home_document_id)
    remove_foreign_key :versions, :documents, column: :document_id if foreign_key_exists?(:versions, :documents, column: :document_id)

    # Step 1: Change document_id columns from bigint to string
    change_column :document_imports, :document_id, :string
    change_column :inline_comment_threads, :document_id, :string
    change_column :spaces, :home_document_id, :string
    change_column :versions, :document_id, :string

    # Step 2: Change polymorphic parent_id columns from bigint to string
    # Note: Space parent_id references should have been updated in Space migration
    # We're only handling Document references here
    change_column :attachments, :parent_id, :string
    change_column :tables, :parent_id, :string

    # Step 3: Update direct FK columns to use NPIs
    execute <<-SQL
      UPDATE document_imports
      SET document_id = documents.npi
      FROM documents
      WHERE document_imports.document_id::text = documents.id::text
    SQL

    execute <<-SQL
      UPDATE inline_comment_threads
      SET document_id = documents.npi
      FROM documents
      WHERE inline_comment_threads.document_id::text = documents.id::text
    SQL

    execute <<-SQL
      UPDATE spaces
      SET home_document_id = documents.npi
      FROM documents
      WHERE spaces.home_document_id::text = documents.id::text
    SQL

    execute <<-SQL
      UPDATE versions
      SET document_id = documents.npi
      FROM documents
      WHERE versions.document_id::text = documents.id::text
    SQL

    # Step 3: Update polymorphic parent_id columns (already string)
    execute <<-SQL
      UPDATE attachments
      SET parent_id = documents.npi
      FROM documents
      WHERE attachments.parent_type = 'Document'
        AND attachments.parent_id::text = documents.id::text
    SQL

    execute <<-SQL
      UPDATE tables
      SET parent_id = documents.npi
      FROM documents
      WHERE tables.parent_type = 'Document'
        AND tables.parent_id::text = documents.id::text
    SQL

    # Step 4: Update polymorphic object_id columns (already string)
    execute <<-SQL
      UPDATE favorites
      SET object_id = documents.npi
      FROM documents
      WHERE favorites.object_type = 'Document'
        AND favorites.object_id = documents.id::text
    SQL

    execute <<-SQL
      UPDATE object_comments
      SET object_id = documents.npi
      FROM documents
      WHERE object_comments.object_type = 'Document'
        AND object_comments.object_id = documents.id::text
    SQL

    execute <<-SQL
      UPDATE object_reactions
      SET object_id = documents.npi
      FROM documents
      WHERE object_reactions.object_type = 'Document'
        AND object_reactions.object_id = documents.id::text
    SQL

    execute <<-SQL
      UPDATE object_tags
      SET object_id = documents.npi
      FROM documents
      WHERE object_tags.object_type = 'Document'
        AND object_tags.object_id = documents.id::text
    SQL

    execute <<-SQL
      UPDATE object_visitors
      SET object_id = documents.npi
      FROM documents
      WHERE object_visitors.object_type = 'Document'
        AND object_visitors.object_id = documents.id::text
    SQL

    execute <<-SQL
      UPDATE public_links
      SET object_id = documents.npi
      FROM documents
      WHERE public_links.object_type = 'Document'
        AND public_links.object_id = documents.id::text
    SQL

    # Step 5: Update spaces.hierarchy JSON column
    # This updates all document IDs in the hierarchy to use NPIs
    # Handles invalid references gracefully (missing documents will keep old IDs)
    Space.find_each do |space|
      next if space.hierarchy.blank?

      updated_hierarchy = update_hierarchy_ids(space.hierarchy)
      space.update_column(:hierarchy, updated_hierarchy) if updated_hierarchy != space.hierarchy
    end

    # Step 6: Drop the old id column (drops PK constraint automatically)
    remove_column :documents, :id

    # Step 7: Rename npi column to id
    rename_column :documents, :npi, :id

    # Step 8: Add primary key constraint on id
    execute "ALTER TABLE documents ADD PRIMARY KEY (id)"

    # Step 9: Re-add foreign key constraints
    add_foreign_key :document_imports, :documents, column: :document_id
    add_foreign_key :inline_comment_threads, :documents, column: :document_id
    add_foreign_key :spaces, :documents, column: :home_document_id
    add_foreign_key :versions, :documents, column: :document_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for documents"
  end

  private

  def update_hierarchy_ids(hierarchy)
    # Build a mapping of old IDs to NPIs
    old_ids = collect_ids_from_hierarchy(hierarchy)
    return hierarchy if old_ids.empty?

    id_mapping = {}
    Document.where(id: old_ids).pluck(:id, :npi).each do |old_id, npi|
      id_mapping[old_id] = npi
    end

    # Recursively update the hierarchy
    deep_update_hierarchy(hierarchy, id_mapping)
  end

  def collect_ids_from_hierarchy(nodes)
    ids = []
    nodes.each do |node|
      ids << node["id"] if node["id"].present?
      ids += collect_ids_from_hierarchy(node["children"]) if node["children"].present?
    end
    ids.uniq
  end

  def deep_update_hierarchy(nodes, id_mapping)
    nodes.map do |node|
      updated_node = node.dup
      if node["id"].present? && id_mapping[node["id"]]
        updated_node["id"] = id_mapping[node["id"]]
      end
      if node["children"].present?
        updated_node["children"] = deep_update_hierarchy(node["children"], id_mapping)
      end
      updated_node
    end
  end
end
