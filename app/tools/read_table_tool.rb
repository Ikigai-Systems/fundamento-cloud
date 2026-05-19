# frozen_string_literal: true

class ReadTableTool < ApplicationTool
  description "Read rows from a table. Returns paginated row data along with the column schema. " \
              "Use DescribeTable first if you only need the schema. " \
              "Each row is keyed by column id; the column schema maps ids to names. " \
              "For large tables call repeatedly with offset to page through results."

  MAX_LIMIT = 1000
  DEFAULT_LIMIT = 100

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table id or name." },
      space_id: { type: :string, description: "Optional space id to disambiguate by-name lookups." },
      evaluate_formulas: { type: :boolean, description: "When true (default), formula columns are evaluated; otherwise raw values are returned." },
      limit: { type: :integer, description: "Maximum rows to return. Defaults to 100, capped at 1000." },
      offset: { type: :integer, description: "Number of rows to skip. Defaults to 0." }
    },
    required: [:table_id]
  )

  annotations(
    title: "Read Table",
    read_only_hint: true,
    destructive_hint: false,
  )

  def self.perform(table_id:, server_context:, space_id: nil, evaluate_formulas: true, limit: nil, offset: nil)
    pundit_user = pundit_user_from_context(server_context)

    space = nil
    if space_id.present?
      space = pundit_user.current_organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    table = Formula::TableLookup.new(space: space, pundit_user: pundit_user).find!(table_id)

    effective_limit = [(limit || DEFAULT_LIMIT).to_i, MAX_LIMIT].min
    effective_limit = DEFAULT_LIMIT if effective_limit <= 0
    effective_offset = [(offset || 0).to_i, 0].max

    data = table.data_to_json(
      evaluate_formulas: evaluate_formulas,
      evaluate_as: pundit_user.organization_membership
    )

    total = data[:rows].size
    paginated = { columns: data[:columns], rows: data[:rows].slice(effective_offset, effective_limit) || [] }
    serialized = TableDataBlueprint.render(paginated)

    MCP::Tool::Response.new(structured_content: {
      id: table.id,
      name: table.name,
      space_id: table.space_id,
      columns: serialized[:columns],
      rows: serialized[:rows],
      row_count: total,
      returned: serialized[:rows].size,
      offset: effective_offset,
      has_more: effective_offset + serialized[:rows].size < total
    })
  end
end
