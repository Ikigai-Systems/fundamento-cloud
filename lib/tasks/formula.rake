require "mini_racer"

namespace :formula do
  desc "Example of integration between Node and Ruby code"
  task process: :environment do
    context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    context.eval("var exports = {};")
    context.eval(bundled_js)

    result = context.eval("exports.evaluateFormula(\"True()\")")

    puts result
  end
end