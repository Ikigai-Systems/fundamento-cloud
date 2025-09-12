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

    # Normalize tags (strip # prefix, downcase)
    normalized_tags = tags.map { |tag| normalize_tag_name(tag) }

    # Remove tags within a transaction
    removed_count = 0
    ActiveRecord::Base.transaction do
      normalized_tags.each do |tag_name|
        # Find the tag in the object's space
        tag = Tag.find_by(
          name: tag_name,
          space: object.space,
          organization: pundit_user.current_organization
        )
        
        if tag
          # Remove the ObjectTag association if it exists
          object_tag = ObjectTag.find_by(
            tag: tag,
            object: object,
            organization: pundit_user.current_organization
          )
          
          if object_tag
            object_tag.destroy!
            removed_count += 1
          end
        end
        # Silently ignore non-existent tags or associations
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