# frozen_string_literal: true

# Shared helpers for MCP tools that invoke Formula::ActionExecutor and need to
# return formula errors as structured payloads (so the agent can recover by
# correcting the input rather than retrying blindly).
#
# `extend` this module in tool classes since `self.call` is a class method.
module FormulaErrorHandling
  FORMULA_DOCS_URL = "https://docs.fundamento.it/formulas/reference"

  CONDITION_FORMULA_EXAMPLES = [
    'Equals(CurrentRow("Status"), "Done")',
    'Greater(CurrentRow("Value"), 100)',
    'And(Equals(CurrentRow("Type"), "Bug"), Equals(CurrentRow("Priority"), "High"))'
  ].freeze

  VALUE_FORMULA_EXAMPLES = [
    'Now()',
    'Concatenate("Hello, ", CurrentRow("Name"))',
    'Add(CurrentRow("Subtotal"), CurrentRow("Tax"))'
  ].freeze

  def condition_formula_error_response(exception)
    MCP::Tool::Response.new(structured_content: {
      error: "Invalid condition_formula: #{exception.cause_message}",
      error_type: "invalid_condition_formula",
      field: "condition_formula",
      formula: exception.formula,
      examples: CONDITION_FORMULA_EXAMPLES,
      documentation_url: FORMULA_DOCS_URL
    })
  end

  def value_formula_error_response(exception)
    MCP::Tool::Response.new(structured_content: {
      error: "Invalid formula in values[#{exception.column_name.inspect}]: #{exception.cause_message}",
      error_type: "invalid_value_formula",
      field: exception.column_name,
      formula: exception.formula,
      examples: VALUE_FORMULA_EXAMPLES,
      documentation_url: FORMULA_DOCS_URL
    })
  end
end
