class ListObjectsByTagsTool < ApplicationTool
  description "List all documents or tables that have all of the specified tags. If multiple tags are provided, only objects that have ALL tags will be returned."

  input_schema(
    properties: {
      tags: {
        type: :array,
        items: { type: :string },
        description: "Array of tags with # prefix (e.g., ['#business', '#business/marketing'])",
        minItems: 1
      },
      object_types: {
        type: :array,
        items: { type: :string, enum: ["Document", "Table"] },
        description: "Types of objects to include in search. Defaults to both Document and Table if not specified"
      },
      space_id: {
        type: :string,
        description: "ID of the space to search in. If not provided, searches across all spaces in the organization"
      }
    },
    required: [:tags]
  )

  annotations(
    title: "List Objects By Tags",
    read_only_hint: true,
  )

  def self.perform(tags:, object_types: nil, space_id: nil, server_context:)
    pundit_user = pundit_user_from_context(server_context)
    organization = pundit_user.current_organization

    # Normalize tags by removing # prefix and converting to lowercase
    normalized_tags = tags.map { |tag| tag.strip.downcase.sub(/\A#/, "") }

    # Default to both object types if not specified
    object_types ||= ["Document", "Table"]

    # Validate object types
    invalid_types = object_types - ["Document", "Table"]
    raise ArgumentError, "Invalid object_types: #{invalid_types}" unless invalid_types.empty?

    # Find tags in the organization
    tag_scope = organization.tags.where(name: normalized_tags)

    # Filter by space if provided
    if space_id.present?
      space = organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
      tag_scope = tag_scope.where(space: space)
    end

    found_tags = tag_scope.to_a

    # Check if all requested tags were found
    found_tag_names = found_tags.map(&:name).sort
    if found_tag_names != normalized_tags.sort
      missing_tags = normalized_tags - found_tag_names
      return MCP::Tool::Response.new([
        {
          type: "text",
          text: {
            message: "Some tags were not found",
            missing_tags: missing_tags.map { |tag| "##{tag}" },
            objects: []
          }.to_json
        }
      ])
    end

    # Find objects that have ALL the specified tags
    results = []

    object_types.each do |object_type|
      # Get the base scope for the object type
      base_scope = case object_type
      when "Document"
        organization.documents
      when "Table"
        organization.tables
      end

      # Filter by space if provided
      if space_id.present?
        base_scope = base_scope.where(space: space)
      end

      # Find objects that have all the specified tags
      # We need to join with object_tags and ensure the object has ALL tags
      objects_with_all_tags = base_scope
        .joins(:object_tags)
        .where(object_tags: { tag_id: found_tags.map(&:id) })
        .group("#{object_type.downcase}s.id")
        .having("COUNT(DISTINCT object_tags.tag_id) = ?", found_tags.count)
        .includes(:tags)

      # Check authorization for each object and serialize
      objects_with_all_tags.each do |object|
        begin
          Pundit.authorize(pundit_user, object, :show?)
          results << serialize_object(object)
        rescue Pundit::NotAuthorizedError
          # Skip objects the user can't access
          next
        end
      end
    end

    MCP::Tool::Response.new([
      {
        type: "text",
        text: {
          message: "Found #{results.count} objects with all specified tags",
          requested_tags: tags,
          objects: results
        }.to_json
      }
    ])
  end

  private

  def self.serialize_object(object)
    case object
    when Document
      {
        id: object.id,
        title: object.title,
        object_type: "Document",
        tags: object.tags.map { |tag| "##{tag.name}" }.sort,
        space_id: object.space.id,
        updated_at: object.updated_at
      }
    when Table
      {
        id: object.id,
        name: object.name,
        object_type: "Table",
        tags: object.tags.map { |tag| "##{tag.name}" }.sort,
        space_id: object.space.id,
        updated_at: object.updated_at
      }
    else
      raise ArgumentError, "Unknown object type for serialization: #{object.class}"
    end
  end
end