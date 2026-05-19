# frozen_string_literal: true

class UpdateRowsTool < ApplicationTool
  extend FormulaErrorHandling

  description "Update cells on rows that match a condition formula. " \
              "condition_formula is a formula returning a boolean per row (use CurrentRow(\"Column\") to access the row). " \
              "values is a map of column id or column name to the new value (scalar or formula string). " \
              "Formula syntax: https://docs.fundamento.it/formulas/reference."

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table id or name." },
      space_id: { type: :string, description: "Optional space id to disambiguate by-name lookups." },
      condition_formula: {
        type: :string,
        description: "Formula evaluated per row; rows where it returns truthy are updated. Pass an empty string to update every row."
      },
      values: {
        type: :object,
        description: "Map of column id (or column name) to new value. Unknown columns are ignored.",
        additionalProperties: true
      }
    },
    required: [:table_id, :condition_formula, :values]
  )

  annotations(
    title: "Update Rows",
    read_only_hint: false,
    destructive_hint: true,
  )

  def self.perform(table_id:, condition_formula:, values:, server_context:, space_id: nil)
    pundit_user = pundit_user_from_context(server_context)

    space = nil
    if space_id.present?
      space = pundit_user.current_organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    executor = Formula::ActionExecutor.new(
      dry_mode: false,
      space: space,
      organization_membership: pundit_user.organization_membership
    )

    begin
      updated = executor.update_rows({}, table_id, condition_formula, values || {})
    rescue Formula::ActionExecutor::ConditionFormulaError => e
      return condition_formula_error_response(e)
    rescue Formula::ActionExecutor::ValueFormulaError => e
      return value_formula_error_response(e)
    end

    MCP::Tool::Response.new(structured_content: {
      updated_row_ids: updated.map(&:id),
      count: updated.size
    })
  end
end
