class FormulasController < ActionController::Base
  def eval
    # todo: some kind of autorization? that user is logged in?

    formula = params["formula"]
    # additional_context = JSON.parse(params["additional_context"].to_s)

    formula_evaluation = FormulaEvalGateway.evaluate(formula)

    respond_to do |format|
      format.json { render json: formula_evaluation }
      format.all { head :unprocessable_content }
    end
  end

  private
end
