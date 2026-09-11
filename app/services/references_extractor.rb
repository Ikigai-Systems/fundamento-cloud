# referenced_title and referenced_icon are both filled in by
# SidebarConnectionsTab#with_link_details, which is where the referenced record
# is actually loaded.
DocumentReference = Struct.new(
  :referenced_type, :referenced_id, :referenced_by, :referenced_path, :referenced_title, :referenced_icon
)

class ReferencesExtractor
  def self.all_references(documents)
    docs_by_id = documents.index_by(&:id)
    return [] if docs_by_id.empty?

    refs = ObjectReference.where(
      source_type: "Document",
      source_id: docs_by_id.keys,
      current: true,
      target_type: ["Document", "Table"]
    ).where.not(target_id: nil)

    # We only return a single reference for every object that references it,
    # so the key is [source_id, target_type, target_id]
    unique_references = {}

    refs.each do |ref|
      key = [ref.source_id, ref.target_type, ref.target_id]
      next if unique_references.key?(key)

      unique_references[key] = DocumentReference.new(
        referenced_by: docs_by_id[ref.source_id],
        referenced_type: ref.target_type,
        referenced_id: ref.target_id
      )
    end

    unique_references.values
  end
end
