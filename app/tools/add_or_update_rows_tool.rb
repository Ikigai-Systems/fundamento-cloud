# frozen_string_literal: true

class AddOrUpdateRowsTool < ApplicationTool
  description "Upsert rows: when no row matches condition_formula, add a new row with the given values; " \
              "otherwise update every matching row. " \
              "Formula syntax: https://docs.fundamento.it/formulas/reference."

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table NPI or name." },
      space_id: { type: :string, description: "Optional space NPI to disambiguate by-name lookups." },
      condition_formula: {
        type: :string,
        description: "Formula evaluated per row; matching rows are updated. If no row matches, a new row is added."
      },
      values: {
        type: :object,
        description: "Map of column NPI (or column name) to value. Unknown columns are ignored.",
        additionalProperties: true
      }
    },
    required: [:table_id, :condition_formula, :values]
  )

  annotations(
    title: "Add or Update Rows",
    read_only_hint: false,
  )

  def self.call(table_id:, condition_formula:, values:, server_context:, space_id: nil)
    pundit_user = pundit_user_from_context(server_context)

    space = nil
    if space_id.present?
      space = pundit_user.current_organization.spaces.find_by_param!(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    executor = Formula::ActionExecutor.new(
      dry_mode: false,
      space: space,
      organization_membership: pundit_user.organization_membership
    )

    begin
      result = executor.add_or_update_rows({}, table_id, condition_formula, values || {})
    rescue ActiveRecord::RecordNotFound, Pundit::NotAuthorizedError
      raise
    rescue => e
      return MCP::Tool::Response.new(structured_content: { error: "Unable to upsert rows due to error: #{e.message}" })
    end

    MCP::Tool::Response.new(structured_content: {
      added_row_ids: result[:added].map(&:id),
      updated_row_ids: result[:updated].map(&:id)
    })
  end
end
