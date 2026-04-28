# frozen_string_literal: true

class AddRowTool < ApplicationTool
  extend FormulaErrorHandling

  description "Add a single row to a table. Values is a map of column id or column name to the cell value. " \
              "Cell values may be plain scalars or formula strings (e.g. \"Now()\"); formula syntax is documented at " \
              "https://docs.fundamento.it/formulas/reference."

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table id or name." },
      space_id: { type: :string, description: "Optional space id to disambiguate by-name lookups." },
      values: {
        type: :object,
        description: "Map of column id (or column name) to cell value. Unknown columns are ignored.",
        additionalProperties: true
      }
    },
    required: [:table_id, :values]
  )

  annotations(
    title: "Add Row",
    read_only_hint: false,
  )

  def self.call(table_id:, values:, server_context:, space_id: nil)
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
      row = executor.add_row({}, table_id, values || {})
    rescue ActiveRecord::RecordNotFound, Pundit::NotAuthorizedError
      raise
    rescue Formula::ActionExecutor::ValueFormulaError => e
      return value_formula_error_response(e)
    rescue => e
      return MCP::Tool::Response.new(structured_content: { error: "Unable to add row due to error: #{e.message}" })
    end

    MCP::Tool::Response.new(structured_content: {
      row_id: row.id,
      table_id: row.table_id,
      values: row.cells.includes(:column).each_with_object({}) { |cell, hash|
        hash[cell.column.name] = cell.value
      }
    })
  end
end
