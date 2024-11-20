class Tables::Cell < ApplicationRecord
  self.table_name = :table_cells

  belongs_to :organization
  belongs_to :table
  belongs_to :column, class_name: "Tables::Column"
  belongs_to :row, class_name: "Tables::Row"

  # TODO: that's probably not the best place to keep it, should be moved to a separate service object in the future
  def evaluate_value(additional_context)
    return value unless column.formula?

    FormulaEvalGateway.evaluate(column.formula, additional_context)
  end
end