class SearchTool < ApplicationTool
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
      limit: { type: :integer, description: "Results per page, 1-#{ObjectSearch::MAX_LIMIT}. Defaults to 25." },
      offset: { type: :integer, description: "Results to skip, for paging. Defaults to 0." },
    }
  )

  annotations(
    title: "Search",
    read_only_hint: true,
    destructive_hint: false,
  )

  def self.perform(server_context:, **params)
    pundit_user = pundit_user_from_context(server_context)

    MCP::Tool::Response.new(structured_content: ObjectSearch.call(pundit_user:, **params))
  end
end
