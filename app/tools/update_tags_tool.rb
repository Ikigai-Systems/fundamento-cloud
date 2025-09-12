class UpdateTagsTool < ApplicationTool
  description "Replace all tags on an object (document or table) with a new set. Creates tags automatically if they don't exist."

  input_schema(
    properties: {
      object_npi: { type: :string, description: "NPI of the object to update tags for" },
      object_type: { type: :string, enum: ["Document", "Table"], description: "Type of object to update" },
      tags: { 
        type: :array, 
        items: { type: :string }, 
        description: "Complete new set of tags with # prefix (e.g., ['#biznes', '#marketing']). Use empty array to remove all tags."
      }
    },
    required: [:object_npi, :object_type, :tags]
  )

  annotations(
    title: "Update Tags",
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

    # Update tags atomically within a transaction
    ActiveRecord::Base.transaction do
      # Remove all existing ObjectTag associations for this object
      ObjectTag.where(
        object: object,
        organization: pundit_user.current_organization
      ).destroy_all

      # Add new tags if any were provided
      normalized_tags.each do |tag_name|
        next if tag_name.blank? # Skip empty tag names
        
        # Find or create the tag in the object's space
        tag = find_or_create_tag(tag_name, object.space, pundit_user.current_organization)
        
        # Create the ObjectTag association
        ObjectTag.create!(
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