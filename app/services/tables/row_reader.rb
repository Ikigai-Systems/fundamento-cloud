# Reads a table's rows in order, with the stored text of each row's cells by column id, and shapes
# them for the two things that read a table: the grid (#grid_rows, text as the UI shows it) and
# formulas (#typed_rows, what `Table()` returns).
#
# When formulas are evaluated, each row gets a Tables::FormulaRow, so a formula column can read
# any other one.
class Tables::RowReader
  attr_reader :columns

  def initialize(table, evaluate_as: nil)
    @table = table
    @evaluate_as = evaluate_as
    @columns = table.columns_in_order
    @time_zone = table.organization.time_zone
  end

  # Rows keyed by column id, as TableDataBlueprint and the grid expect them. A formula column
  # holds its result as cell text, or the error message.
  def grid_rows(evaluate_formulas:)
    each_row do |row, values_by_column_id|
      formula_row = formula_row_for(values_by_column_id) if evaluate_formulas && columns.any?(&:formula?)

      columns.each_with_object({}) do |column, hash|
        hash[column.id] =
          if formula_row && column.formula?
            evaluation = formula_row.evaluation_for(column)
            evaluation["error"] || Tables::FormulaValues.serialized(column, evaluation["result"], @time_zone)
          else
            column.grid_value(values_by_column_id[column.id])
          end
      end.merge("id" => row.id) # this is for Rowstack convenience
    end
  end

  # Rows as a formula sees a table through Table("..."): values keyed by column name and id, typed
  # from the column (see Tables::FormulaValues), and a formula column holds its typed result.
  def typed_rows
    raise ArgumentError, "evaluate_as must be set!" if @evaluate_as.blank?

    each_row do |row, values_by_column_id|
      formula_row = formula_row_for(values_by_column_id)

      columns.each_with_object({}) do |column, hash|
        value =
          if column.formula?
            evaluation = formula_row.evaluation_for(column)
            evaluation["error"] || evaluation["result"]
          elsif column.checkbox?
            column.grid_value(values_by_column_id[column.id])
          else
            formula_row.fetch(column.id)
          end

        hash[column.name] = value
        hash[column.id] = value
      end.merge("id" => row.id)
    end
  end

  private

  def each_row
    cells_by_row_and_column = @table.cells.index_by { |cell| [cell.row_id, cell.column_id] }

    @table.rows_in_order.map do |row|
      yield row, columns.to_h { |column| [column.id, cells_by_row_and_column[[row.id, column.id]]&.value] }
    end
  end

  def formula_row_for(values_by_column_id)
    Tables::FormulaRow.new(columns, values_by_column_id, @time_zone) do |formula, current_row|
      FormulaService.evaluate(formula, @table.space, @evaluate_as, additional_context: { "currentRow" => current_row })
    end
  end
end
