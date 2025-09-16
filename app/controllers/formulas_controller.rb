class FormulasController < ApplicationController
  include EnsureOrganization

  def eval
    # todo: some kind of autorization? that user is logged in?

    formula = params["formula"]

    additional_context = {}
    this_row = params.fetch("additional_context", {})&.[]("this_row")
    additional_context["ThisRow"] = this_row if this_row.present?

    formula_evaluation = FormulaService.evaluate(
      formula,
      current_organization.spaces.find_by_param!(params[:space_npi] || params.dig("evaluation_context", "space_npi")),
      current_organization_user,
      additional_context: additional_context
    )

    respond_to do |format|
      format.json { render json: formula_evaluation }
      format.all { head :unprocessable_content }
    end
  end

  private
end
