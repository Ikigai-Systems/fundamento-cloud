# frozen_string_literal: true

class DescribeTableTool < ApplicationTool
  description "Return a table's schema (columns, types, row count) without loading row data. " \
              "Use this before ReadTable on tables you don't know, to understand their structure. " \
              "table_id accepts either the table's id or its name; supply space_id when names may collide across spaces."

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table id or name." },
      space_id: { type: :string, description: "Optional space id to disambiguate by-name lookups." }
    },
    required: [:table_id]
  )

  annotations(
    title: "Describe Table",
    read_only_hint: true,
  )

  def self.perform(table_id:, server_context:, space_id: nil)
    pundit_user = pundit_user_from_context(server_context)

    space = nil
    if space_id.present?
      space = pundit_user.current_organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    table = Formula::TableLookup.new(space: space, pundit_user: pundit_user).find!(table_id)

    columns = table.columns_in_order.map do |column|
      {
        id: column.id,
        name: column.name,
        kind: column.kind,
        formula: column.formula,
        configuration: column.configuration,
        options: column.options
      }
    end

    MCP::Tool::Response.new(structured_content: {
      id: table.id,
      name: table.name,
      space_id: table.space_id,
      archived: table.archived,
      row_count: table.rows.count,
      columns: columns
    })
  end
end
