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
    documents_by_id = space.documents_from_hierarchy.index_by(&:id)
    space.hierarchy.map { |node| serialize_hierarchy_node(node, documents_by_id) }
  end

  def self.serialize_hierarchy_node(node, documents_by_id)
    {
      id: documents_by_id[node["id"]].id,
      npi: documents_by_id[node["id"]].id, # FIXME: something still depends on this but we should refactor it
      title: documents_by_id[node["id"]].title,
      children: node["children"].map { |child| serialize_hierarchy_node(child, documents_by_id) },
    }
  end
end
