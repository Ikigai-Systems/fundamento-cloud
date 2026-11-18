# A row as `CurrentRow` sees it: the typed values of its cells (see Tables::FormulaValues), where
# a formula column's value is its formula's result, worked out the first time something reads it.
#
# Reading it on demand lets a formula column refer to any other formula column in the row, in any
# order, and see a typed result (a Date stays a Date) instead of text. A column that ends up
# depending on itself is an error naming the loop, and an error in a column it reads is reported
# by the column that reads it.
#
# Only lookups by column name or id evaluate a formula. Iterating the row (`CurrentRow()` on its
# own) shows what is stored, which for a formula column is nothing.
class Tables::FormulaRow < Hash
  ERROR_PREFIX = /\AUnable to evaluate formula due to error: /

  # `evaluate` is called with a formula and this row, and returns what FormulaService.evaluate does.
  def initialize(columns, values_by_column_id, time_zone, &evaluate)
    super()
    merge!(Tables::FormulaValues.current_row(columns, values_by_column_id, time_zone))

    @evaluate = evaluate
    @formula_columns = {}
    columns.each do |column|
      if column.formula?
        @formula_columns[column.name] = column
        @formula_columns[column.id] = column
      else
        @formula_columns.delete(column.name)
        @formula_columns.delete(column.id)
      end
    end
    @evaluations = {}
    @resolving = []
  end

  def [](key)
    column = @formula_columns[key]
    column ? value_of(column) : super
  end

  # The evaluation of a formula column: a hash with "result" or "error", worked out once.
  def evaluation_for(column)
    return @evaluations[column.id] if @evaluations.key?(column.id)

    if @resolving.include?(column.id)
      loop_names = @resolving.drop_while { |id| id != column.id }.push(column.id).map { |id| name_of(id) }
      raise "Circular reference: #{loop_names.join(" -> ")}"
    end

    @resolving.push(column.id)
    begin
      @evaluations[column.id] = @evaluate.call(column.formula, self)
    ensure
      @resolving.pop
    end
  end

  private

  def value_of(column)
    evaluation = evaluation_for(column)
    raise "Column \"#{column.name}\" has an error: #{evaluation["error"].sub(ERROR_PREFIX, "")}" if evaluation["error"]

    evaluation["result"]
  end

  def name_of(column_id)
    @formula_columns.each_value.find { |column| column.id == column_id }.name
  end
end
