class FormulaEvalGateway
  #todo: deprecate and remove
  def self.evaluate_old_way(formula, additional_context)
    mini_racer_context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    mini_racer_context.eval("var exports = {};")
    mini_racer_context.eval(bundled_js)
    mini_racer_context.eval("var formula = #{(formula || {}).to_json};")
    mini_racer_context.eval("var context = #{additional_context.to_json}")
    mini_racer_context.eval("exports.evaluateFormula(formula, context)")
  end

  def self.evaluate(formula, additional_context)
    microservice_url = URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"])

    client = NetHttp2::Client.new(URI.join(microservice_url, "/"))

    res = client.call(:post, microservice_url.path, headers: {
      "Content-type" => "application/json",
      "Accept" => "application/json",
    }, body: {
      formula: formula,
      additional_context: additional_context,
    }.to_json)

    #todo: preserve client open between calls
    client.close

    JSON.parse(res.body)

    # non HTTP/2 way:
    # res = Net::HTTP.post_form(
    #   URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"]),
    #   formula: formula,
    #   additional_context: additional_context.to_json,
    # )

  rescue Exception => e
    return {
      "error" => "Fatal error: unable to evaluate formula"
    }
  end

end