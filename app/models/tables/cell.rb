class Tables::Cell < ApplicationRecord
  self.table_name = :table_cells

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"
  belongs_to :column, class_name: "Tables::Column"
  belongs_to :row, class_name: "Tables::Row"

  # TODO: that's probably not the best place to keep it, should be moved to a separate service object in the future
  def evaluate_value
    return value unless column.formula?

    context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    context.eval("var exports = {};")
    context.eval(bundled_js)
    context.eval("var formula = #{value.to_json};")
    context.eval("exports.evaluateFormula(formula)")
  end
end