class FormulasController < ApplicationController
  def eval
    # todo: some kind of autorization? that user is logged in?

    formula = params["formula"]
    evaluation_context = params["evaluation_context"] || {}
    evaluation_context["user_id"] = current_user.id

    formula_evaluation = FormulaEvalGateway.evaluate(formula, evaluation_context: evaluation_context)

    respond_to do |format|
      format.json { render json: formula_evaluation }
      format.all { head :unprocessable_content }
    end
  end

  private
end
