class RemoveTagsTool < ApplicationTool
  description "Remove one or more tags from an object (document or table). Tags remain in database after removal."

  input_schema(
    properties: {
      object_npi: { type: :string, description: "NPI of the object to untag" },
      object_type: { type: :string, enum: ["Document", "Table"], description: "Type of object to untag" },
      tags: { 
        type: :array, 
        items: { type: :string }, 
        description: "Array of tags with # prefix to remove (e.g., ['#biznes', '#marketing'])",
        minItems: 1
      }
    },
    required: [:object_npi, :object_type, :tags]
  )

  annotations(
    title: "Remove Tags",
    read_only_hint: false,
  )

  def self.call(object_npi:, object_type:, tags:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    # Resolve the object polymorphically
    object = resolve_object(object_npi, object_type, pundit_user.current_organization)
    
    # Check authorization
    Pundit.authorize(pundit_user, object, :update?)

    # Use TagsService to remove tags
    tags_service = TagsService.new(
      object: object,
      organization: pundit_user.current_organization
    )
    
    tags_service.remove_tags(tags)

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

  def self.resolve_object(npi, object_type, organization)
    case object_type
    when "Document"
      organization.documents.find_by_param!(npi)
    when "Table"
      organization.tables.find_by_param!(npi)
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
        npi: object.npi,
        name: object.name,
        tags: object.tags.map { |tag| "##{tag.name}" }
      }.to_json
    else
      raise ArgumentError, "Unknown object type for serialization"
    end
  end
end