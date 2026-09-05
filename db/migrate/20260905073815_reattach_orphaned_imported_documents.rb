# Repairs documents that imported successfully but never made it into their space's
# hierarchy, so they exist and are reachable by URL but never appear in the sidebar.
#
# Cause: ImportDocumentJob did an unlocked read-modify-write of the whole spaces.hierarchy
# JSON column, so concurrent jobs dropped each other's nodes; and when a parent directory
# document's own node was lost, add_item_to_hierarchy! returned nil and the child was
# silently discarded. Both are fixed in the same change as this migration.
#
# Idempotent: re-running finds nothing to do.
class ReattachOrphanedImportedDocuments < ActiveRecord::Migration[8.1]
  def up
    repaired = 0

    ImportSession.find_each do |session|
      space = session.space
      next if space.nil?

      attached_ids = hierarchy_ids(space.hierarchy)

      orphans = session.import_files
        .where(file_type: ImportFile.file_types[:document], status: ImportFile.statuses[:completed])
        .where.not(document_id: nil)
        .reject { |import_file| attached_ids.include?(import_file.document_id) }

      next if orphans.empty?

      orphans.each do |import_file|
        # Skip rows whose document has since been deleted.
        next unless Document.exists?(id: import_file.document_id, space_id: space.id)

        parent_dir = File.dirname(import_file.relative_path)
        parent_id = parent_dir == "." ? nil : session.path_map[parent_dir]

        space.insert_hierarchy_node!(import_file.document_id, parent_id: parent_id)
        repaired += 1
      end
    end

    say "Re-attached #{repaired} orphaned document(s) to their space hierarchy"
  end

  def down
    # Nothing to undo — removing the nodes again would re-hide the documents.
  end

  private

  def hierarchy_ids(nodes, collected = Set.new)
    Array(nodes).each do |node|
      collected << node["id"]
      hierarchy_ids(node["children"], collected)
    end
    collected
  end
end
