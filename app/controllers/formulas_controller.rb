class FormulasController < ApplicationController
  def eval
    # todo: some kind of autorization? that user is logged in?

    formula = params["formula"]

    formula_evaluation = FormulaEvalGateway.evaluate(
      formula,
      current_organization.spaces.find_by_param!(params.dig("evaluation_context", "space_npi")),
      current_organization_user,
    )

    respond_to do |format|
      format.json { render json: formula_evaluation }
      format.all { head :unprocessable_content }
    end
  end

  private
end
