# frozen_string_literal: true

class RunFormulaTool < ApplicationTool
  description 'Run code using an Excel like formula language, language documentation available at https://docs.fundamento.it/formulas/reference'

  input_schema(
    properties: {
      formula: { type: :string },
      space_id: { type: :string },
    },
    required: [:formula]
  )

  annotations(
    title: "Run a formula",
    read_only_hint: true,
  )

  def self.perform(formula:, space_id:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    space = nil

    if space_id.present?
      space = pundit_user.current_organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    result = FormulaService.evaluate(
      formula,
      space,
      pundit_user.organization_membership,
      additional_context: {}
    )

    MCP::Tool::Response.new(structured_content: result)
  end
end
