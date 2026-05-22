class SpaceBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :archived

  view :mcp do
    field :documents do |space|
      documents = space.documents_from_hierarchy.index_by(&:id)
      space.hierarchy.map { |node| serialize_hierarchy_node(node, documents) }
    end
  end

  private

  def self.serialize_hierarchy_node(node, documents_by_id)
    {
      npi: documents_by_id[node["id"]].id,
      title: documents_by_id[node["id"]].title,
      children: node["children"].map { |child| serialize_hierarchy_node(child, documents_by_id) },
    }
  end
end