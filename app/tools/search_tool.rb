class SearchTool < ApplicationTool
  MAX_LIMIT = 100

  description "Use this tool to find documents and tables. Combine any of: a title substring (query), tags, a space, " \
              "and an update-time range; at least one of query, tags, space_id, updated_after and updated_before is required. " \
              "Each result carries a ready-made `mention` snippet: paste it into Markdown to link to that object " \
              "(the link shows the object's title and follows renames). Prefer it over writing a URL."

  input_schema(
    properties: {
      query: { type: :string, description: "Case-insensitive substring of the title or table name, at least 2 characters. Titles only, not content." },
      object_types: {
        type: :array,
        items: { type: :string, enum: ["Document", "Table"] },
        description: "Defaults to both Document and Table."
      },
      tags: {
        type: :array,
        items: { type: :string },
        description: "Tags with # prefix (e.g. ['#status/wip']). Only objects with ALL of them are returned."
      },
      space_id: { type: :string, description: "Only search in this space." },
      updated_after: { type: :string, description: "ISO 8601 date or time. Only objects updated at or after it." },
      updated_before: { type: :string, description: "ISO 8601 date or time. Only objects updated at or before it." },
      limit: { type: :integer, description: "Results per page, 1-#{MAX_LIMIT}. Defaults to 25." },
      offset: { type: :integer, description: "Results to skip, for paging. Defaults to 0." },
    }
  )

  annotations(
    title: "Search",
    read_only_hint: true,
    destructive_hint: false,
  )

  def self.perform(server_context:, query: nil, object_types: nil, tags: nil, space_id: nil, updated_after: nil, updated_before: nil, limit: 25, offset: 0)
    pundit_user = pundit_user_from_context(server_context)
    organization = pundit_user.current_organization

    query = query.to_s.strip.presence
    tags = Array(tags).map { |tag| tag.strip.downcase.sub(/\A#/, "") }.reject(&:blank?).uniq
    after = parse_time(updated_after, "updated_after")
    before = parse_time(updated_before, "updated_before")
    limit = limit.to_i.clamp(1, MAX_LIMIT)
    offset = [offset.to_i, 0].max

    if [query, tags.presence, space_id.presence, after, before].all?(&:nil?)
      raise ArgumentError, "Provide at least one of query, tags, space_id, updated_after and updated_before."
    end

    if query && query.length < TitleSearch::MIN_QUERY_LENGTH
      raise ArgumentError, "query must be at least #{TitleSearch::MIN_QUERY_LENGTH} characters."
    end

    object_types = Array(object_types.presence || ["Document", "Table"])
    invalid_types = object_types - ["Document", "Table"]
    raise ArgumentError, "Invalid object_types: #{invalid_types.join(", ")}" unless invalid_types.empty?

    if space_id.present?
      space = organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    scopes = object_types.uniq.map do |type|
      scope = Pundit.policy_scope!(pundit_user, organization.public_send(type.underscore.pluralize)).without_archived
      scope = scope.where(space_id: organization.spaces.without_archived.select(:id))
      scope = scope.where(space_id: space.id) if space
      scope = scope.matching_title(query) if query
      scope = scope.where(id: tagged_ids(type, tags)) if tags.any?
      scope = scope.where(updated_at: after..) if after
      scope = scope.where(updated_at: ..before) if before
      scope
    end

    # Each type is capped at offset + limit so the merged page is exact without loading everything.
    candidates = scopes.flat_map { |scope| scope.reorder(updated_at: :desc).limit(offset + limit).includes(:tags).to_a }
    ranked = candidates.sort_by { |record| [query ? rank(record, query) : 0, -record.updated_at.to_f] }
    total = scopes.sum(&:count)

    MCP::Tool::Response.new(
      structured_content: {
        total: total,
        offset: offset,
        objects: ranked.drop(offset).first(limit).map { |record| serialize(record) },
      }
    )
  end

  # Mirrors SearchesController#rank so the command palette and this tool agree on order.
  def self.rank(record, query)
    title = title_of(record).downcase
    needle = query.downcase

    return 0 if title == needle
    return 1 if title.start_with?(needle)

    2
  end

  def self.tagged_ids(type, names)
    ObjectTag.joins(:tag)
      .where(object_type: type, tags: { name: names })
      .group(:object_id)
      .having("COUNT(DISTINCT tags.name) = ?", names.size)
      .select(:object_id)
  end

  def self.parse_time(value, field)
    return nil if value.blank?

    Time.iso8601(value.to_s)
  rescue ArgumentError
    raise ArgumentError, "#{field} must be an ISO 8601 date or time, e.g. 2026-10-01 or 2026-10-01T12:00:00Z."
  end

  def self.title_of(record) = record.is_a?(Table) ? record.name : record.title

  def self.serialize(record)
    entity = record.is_a?(Table) ? "table" : "document"
    title = title_of(record)

    {
      id: record.id,
      object_type: record.class.name,
      title: title,
      icon: record.icon&.as_json,
      color: record.color,
      tags: record.tags.map { |tag| "##{tag.name}" }.sort,
      space_id: record.space_id,
      updated_at: record.updated_at,
      mention: %(<span data-mention="#{entity}" data-entity-id="#{record.id}">#{ERB::Util.html_escape(title)}</span>),
    }
  end
end
