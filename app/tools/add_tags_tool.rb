class AddTagsTool < ApplicationTool
  description "Add one or more tags to an object (document or table). Creates tags automatically if they don't exist in the space."

  input_schema(
    properties: {
      object_id: { type: :string, description: "ID of the object to tag" },
      object_type: { type: :string, enum: ["Document", "Table"], description: "Type of object to tag" },
      tags: { 
        type: :array, 
        items: { type: :string }, 
        description: "Array of tags with # prefix (e.g., ['#business', '#business/marketing'])",
        minItems: 1
      }
    },
    required: [:object_id, :object_type, :tags]
  )

  annotations(
    title: "Add Tags",
    read_only_hint: false,
  )

  def self.call(object_id:, object_type:, tags:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    # Resolve the object polymorphically
    object = resolve_object(object_id, object_type, pundit_user.current_organization)
    
    # Check authorization
    Pundit.authorize(pundit_user, object, :update?)

    # Use TagsService to add tags
    tags_service = TagsService.new(
      object: object,
      organization: pundit_user.current_organization
    )
    
    tags_service.add_tags(tags)

    # Reload object to get updated tags and return response
    object.reload
    
    MCP::Tool::Response.new([
      {
        type: "text",
        text: serialize_object_with_tags(object)
      }
    ])
  end

  private

  def self.resolve_object(id, object_type, organization)
    case object_type
    when "Document"
      organization.documents.find(id)
    when "Table"
      organization.tables.find(id)
    else
      raise ArgumentError, "Unsupported object_type: #{object_type}"
    end
  end

  def self.serialize_object_with_tags(object)
    case object
    when Document
      DocumentBlueprint.render(object, view: :mcp)
    when Table
      # For now, just return basic info since TableBlueprint might not have MCP view
      {
        id: object.id,
        name: object.name,
        tags: object.tags.map { |tag| "##{tag.name}" }
      }.to_json
    else
      raise ArgumentError, "Unknown object type for serialization"
    end
  end
end