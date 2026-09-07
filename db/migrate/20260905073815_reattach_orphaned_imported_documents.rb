# Repairs documents that imported successfully but never made it into their space's
# hierarchy, so they exist and are reachable by URL but never appear in the sidebar.
#
# Cause: ImportDocumentJob did an unlocked read-modify-write of the whole spaces.hierarchy
# JSON column, so concurrent jobs dropped each other's nodes; and when a parent directory
# document's own node was lost, add_item_to_hierarchy! returned nil and the child was
# silently discarded. Both are fixed in the same change as this migration.
#
# Self-contained by design. It first shipped calling Space#insert_hierarchy_node!, which by
# then had grown a compare-and-swap on spaces.hierarchy_version — a column added by a
# *later* migration. Every database running both in one pass therefore aborted with
# PG::UndefinedColumn. A data migration has to work against the schema as it stands at its
# own point in the sequence, so the shims and the tree insert below are frozen copies
# rather than calls into models that keep moving.
#
# Idempotent: re-running finds nothing to do.
class ReattachOrphanedImportedDocuments < ActiveRecord::Migration[8.1]
  class Space < ActiveRecord::Base
    self.table_name = "spaces"
  end

  class ImportSession < ActiveRecord::Base
    self.table_name = "import_sessions"
  end

  class ImportFile < ActiveRecord::Base
    self.table_name = "import_files"

    DOCUMENT = 0  # file_type
    COMPLETED = 4 # status
  end

  class Document < ActiveRecord::Base
    self.table_name = "documents"
  end

  def up
    repaired = 0

    ImportSession.find_each do |session|
      space = Space.find_by(id: session.space_id)
      next if space.nil?

      hierarchy = Array(space.hierarchy)
      attached_ids = hierarchy_ids(hierarchy)
      path_map = session.path_map || {}

      orphans = ImportFile
        .where(import_session_id: session.id, file_type: ImportFile::DOCUMENT, status: ImportFile::COMPLETED)
        .where.not(document_id: nil)
        .reject { |import_file| attached_ids.include?(import_file.document_id) }

      placed = 0

      orphans.each do |import_file|
        # Skip rows whose document has since been deleted.
        next unless Document.exists?(id: import_file.document_id, space_id: space.id)

        parent_dir = File.dirname(import_file.relative_path)
        parent_id = parent_dir == "." ? nil : path_map[parent_dir]

        hierarchy = hierarchy_with_node(hierarchy, parent_id, { "id" => import_file.document_id, "children" => [] })
        placed += 1
      end

      next if placed.zero?

      Space.where(id: space.id).update_all(["hierarchy = ?::json, updated_at = ?", hierarchy.to_json, Time.current])
      repaired += placed
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

  # Returns a new tree with `node` under `parent_id`, appended at the root when the parent
  # is blank or missing from the tree — that missing-parent case is one of the two bugs
  # being repaired here, so it has to be handled rather than raised on.
  def hierarchy_with_node(nodes, parent_id, node)
    nodes = Array(nodes)
    return nodes + [node] if parent_id.blank?

    hierarchy_with_node_under_parent(nodes, parent_id, node) || nodes + [node]
  end

  # Returns a new tree, or nil when `parent_id` is not present anywhere in it.
  def hierarchy_with_node_under_parent(nodes, parent_id, node)
    found = false

    rebuilt = Array(nodes).map do |item|
      next item if found

      children = Array(item["children"])

      if item["id"] == parent_id
        found = true
        item.merge("children" => children + [node])
      elsif (updated = hierarchy_with_node_under_parent(children, parent_id, node))
        found = true
        item.merge("children" => updated)
      else
        item
      end
    end

    found ? rebuilt : nil
  end
end
