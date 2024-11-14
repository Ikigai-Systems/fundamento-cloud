class FormulasController < ActionController::Base
  skip_before_action :verify_authenticity_token

  def eval
    # todo: authorization (will be implemented in node process, if at all)

    formula = params["formula"]
    additional_context = JSON.parse(params["additional_context"].to_s)

    mini_racer_context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    mini_racer_context.eval("var exports = {};")
    mini_racer_context.eval(bundled_js)
    mini_racer_context.eval("var formula = #{formula.to_json};")
    mini_racer_context.eval("var context = #{additional_context.to_json}")
    begin
      formula_result = mini_racer_context.eval("exports.evaluateFormula(formula, context)")
    rescue => e
      formula_error = e
    end

    # resulting json will need to be extended with "operations" chunk indicating what operations should rails
    # app perform upon finishing evaluating formula - operations like 'add_row', 'modify_cell', 'copy document' etc
    render json: {result: formula_result, error: formula_error}
  end

  private
end
