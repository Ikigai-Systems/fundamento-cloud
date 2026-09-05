class SpaceBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :archived, :access_mode, :created_at, :updated_at

  view :with_documents do
    field :documents do |space|
      SpaceBlueprint.serialize_hierarchy(space)
    end
  end

  view :mcp do
    field :documents do |space|
      SpaceBlueprint.serialize_hierarchy(space)
    end
  end

  def self.serialize_hierarchy(space)
    # Only id and title are serialised below; skip the sync blob and the
    # has_versions subquery entirely.
    documents_by_id = space
      .documents_from_hierarchy(scope: space.documents.select(:id, :title))
      .index_by(&:id)
    serialize_hierarchy_nodes(space.hierarchy, documents_by_id)
  end

  def self.serialize_hierarchy_nodes(nodes, documents_by_id)
    Array(nodes).flat_map do |node|
      document = documents_by_id[node["id"]]
      children = node["children"] || []

      # Orphaned hierarchy entry: promote its children, matching SpaceSidebarTree#build.
      # Previously documents_from_hierarchy spliced these out in memory before we got
      # here, so an unhandled nil raised NoMethodError.
      next serialize_hierarchy_nodes(children, documents_by_id) if document.nil?

      [{
        id: document.id,
        npi: document.id, # FIXME: something still depends on this but we should refactor it
        title: document.title,
        children: serialize_hierarchy_nodes(children, documents_by_id),
      }]
    end
  end
end
