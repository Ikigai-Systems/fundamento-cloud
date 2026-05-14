class UpdateTagsTool < ApplicationTool
  description "Replace all tags on an object (document or table) with a new set. Creates tags automatically if they don't exist."

  input_schema(
    properties: {
      object_id: { type: :string, description: "ID of the object to update tags for" },
      object_type: { type: :string, enum: ["Document", "Table"], description: "Type of object to update" },
      tags: { 
        type: :array, 
        items: { type: :string }, 
        description: "Complete new set of tags with # prefix (e.g., ['#biznes', '#marketing']). Use empty array to remove all tags."
      }
    },
    required: [:object_id, :object_type, :tags]
  )

  annotations(
    title: "Update Tags",
    read_only_hint: false,
  )

  def self.perform(object_id:, object_type:, tags:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    # Resolve the object polymorphically
    object = resolve_object(object_id, object_type, pundit_user.current_organization)
    
    # Check authorization
    Pundit.authorize(pundit_user, object, :update?)

    # Use TagsService to update tags
    tags_service = TagsService.new(
      object: object,
      organization: pundit_user.current_organization
    )
    
    tags_service.update_tags(tags)

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