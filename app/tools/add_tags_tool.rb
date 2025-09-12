class AddTagsTool < ApplicationTool
  description "Add one or more tags to an object (document or table). Creates tags automatically if they don't exist in the space."

  input_schema(
    properties: {
      object_npi: { type: :string, description: "NPI of the object to tag" },
      object_type: { type: :string, enum: ["Document", "Table"], description: "Type of object to tag" },
      tags: { 
        type: :array, 
        items: { type: :string }, 
        description: "Array of tags with # prefix (e.g., ['#business', '#business/marketing'])",
        minItems: 1
      }
    },
    required: [:object_npi, :object_type, :tags]
  )

  annotations(
    title: "Add Tags",
    read_only_hint: false,
  )

  def self.call(object_npi:, object_type:, tags:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    # Resolve the object polymorphically
    object = resolve_object(object_npi, object_type, pundit_user.current_organization)
    
    # Check authorization
    Pundit.authorize(pundit_user, object, :update?)

    # Normalize tags (strip # prefix, downcase)
    normalized_tags = tags.map { |tag| normalize_tag_name(tag) }

    # Add tags within a transaction
    ActiveRecord::Base.transaction do
      normalized_tags.each do |tag_name|
        # Find or create the tag in the object's space
        tag = find_or_create_tag(tag_name, object.space, pundit_user.current_organization)
        
        # Create the ObjectTag association if it doesn't exist
        ObjectTag.find_or_create_by!(
          tag: tag,
          object: object,
          organization: pundit_user.current_organization
        )
      end
    end

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

  def self.normalize_tag_name(tag)
    # Strip # prefix if present and normalize
    tag.start_with?("#") ? tag[1..-1].strip.downcase : tag.strip.downcase
  end

  def self.find_or_create_tag(tag_name, space, organization)
    Tag.find_or_create_by!(
      name: tag_name,
      space: space,
      organization: organization
    )
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