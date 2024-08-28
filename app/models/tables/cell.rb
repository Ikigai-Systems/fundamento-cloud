class Tables::Cell < ApplicationRecord
  self.table_name = :table_cells

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"
  belongs_to :column, class_name: "Tables::Column"
  belongs_to :row, class_name: "Tables::Row"

  # TODO: that's probably not the best place to keep it, should be moved to a separate service object in the future
  def evaluate_value(additional_context)
    return value unless column.formula?

    mini_racer_context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    mini_racer_context.eval("var exports = {};")
    mini_racer_context.eval(bundled_js)
    mini_racer_context.eval("var formula = #{column.value_formula.to_json};")
    mini_racer_context.eval("var context = #{additional_context.to_json}")
    mini_racer_context.eval("exports.evaluateFormula(formula, context)")
  end
end