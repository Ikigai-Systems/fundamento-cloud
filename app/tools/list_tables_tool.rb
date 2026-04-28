# frozen_string_literal: true

class ListTablesTool < ApplicationTool
  description "List tables visible to the user. Returns each table's id, name, space, and basic counts. " \
              "Optionally filter to a single space by passing space_id."

  input_schema(
    properties: {
      space_id: { type: :string, description: "ID of the space to list tables in. When omitted, lists tables across the whole organization." },
      include_archived: { type: :boolean, description: "Whether to include archived tables. Defaults to false." }
    }
  )

  annotations(
    title: "List Tables",
    read_only_hint: true,
  )

  def self.call(server_context:, space_id: nil, include_archived: false)
    pundit_user = pundit_user_from_context(server_context)
    organization = pundit_user.current_organization

    scope = Pundit.policy_scope!(pundit_user, organization.tables)
    scope = scope.where(archived: false) unless include_archived

    if space_id.present?
      space = organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
      scope = scope.where(space: space)
    end

    tables = scope.includes(:space).lexicographically.to_a

    row_counts = Tables::Row.where(table_id: tables.map(&:id)).group(:table_id).count
    column_counts = Tables::Column.where(table_id: tables.map(&:id)).group(:table_id).count

    serialized = tables.map do |table|
      {
        id: table.id,
        name: table.name,
        space_id: table.space_id,
        space_name: table.space&.name,
        archived: table.archived,
        row_count: row_counts[table.id] || 0,
        column_count: column_counts[table.id] || 0,
        updated_at: table.updated_at
      }
    end

    MCP::Tool::Response.new(structured_content: { tables: serialized })
  end
end
