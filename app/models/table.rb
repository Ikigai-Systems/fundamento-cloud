require "csv"

class Table < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  belongs_to :parent, polymorphic: true

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all
  has_many :columns, class_name: "Tables::Column", dependent: :delete_all
  has_many :rows, class_name: "Tables::Row", dependent: :delete_all
  has_many :visitors, class_name: "ObjectVisitor", dependent: :delete_all

  scope :lexicographically, -> { order(name: :asc) }

  validates_presence_of :name

  validates_uniqueness_of :name, scope: [:organization_id]

  def order_linked_list(rows, method)
    return [] if rows.nil? || rows.empty?

    # Create a hash where the keys are the id of the previous row and the values are the row objects
    rows_by_previous_id = rows.index_by(&method)

    # Find the first row (the one that has previous_row_id as nil)
    first_row = rows.find { |row| row.send(method).nil? }

    # Initialize the ordered list of rows with the first row
    ordered_rows = [first_row]

    # Take the last one from the ordered list and get a row that references it, then loop again
    while (next_row = rows_by_previous_id[ordered_rows.last.id])
      ordered_rows << next_row
    end

    # Final check for consistency
    raise IndexError.new("Incomplete linked list") if ordered_rows.size != rows_by_previous_id.size

    ordered_rows
  end

  def columns_in_order
    self.order_linked_list(self.columns, :previous_column_id)
  end

  def rows_in_order
    self.order_linked_list(self.rows, :previous_row_id)
  end

  def data_to_json(evaluate_formulas: false)
    columns_in_order = self.columns_in_order
    rows_in_order = self.rows_in_order
    cells_by_rows_and_columns = self.cells.index_by { |cell| [cell.row_id, cell.column_id] }

    formulas_to_evaluate = []

    jsonized_rows = rows_in_order.map do |row|
      if evaluate_formulas
        current_row_values = columns_in_order.each_with_object({}) do |column, hash|
          hash[column.name] = cells_by_rows_and_columns.dig([row.id, column.id])&.value
        end

        additional_context = {
          "currentRow" => current_row_values
        }

        columns_in_order.each_with_object({}) do |column, hash|
          if column.formula?
            formulas_to_evaluate << {
              row_npi: row.npi,
              column_npi: column.npi,
              formula: column.formula,
              additional_context: additional_context,
            }
          else
            hash[column.npi] = cells_by_rows_and_columns.dig([row.id, column.id]).value
          end
        end
      else
        columns_in_order.each_with_object({}) do |column, hash|
          if column.kind == "checkbox"
            hash[column.npi] = cells_by_rows_and_columns.dig([row.id, column.id])&.value == "t"
          else
            hash[column.npi] = cells_by_rows_and_columns.dig([row.id, column.id])&.value
          end
        end
      end.merge({ "npi" => row.npi }) # this is for Rowstack convenience
    end

    unless formulas_to_evaluate.empty?
      FormulaEvalGateway.batch_evaluate(formulas_to_evaluate.map { |e| {formula: e[:formula], additional_context: e[:additional_context]}}, {}).each_with_index do |evaluated_formula, index|
        formula_evaluation = formulas_to_evaluate[index]
        result = evaluated_formula["error"] || evaluated_formula["result"]
        jsonized_rows.find { |row| row["npi"] == formula_evaluation[:row_npi] }[formula_evaluation[:column_npi]] = result
      end
    end

    {
      columns: columns_in_order,
      rows: jsonized_rows,
    }
  end

  def import_from_csv(csv_file)
    # First ensure table is empty as this code assumes that
    assert self.cells.count.zero?
    assert self.rows.count.zero?
    assert self.columns.count.zero?

    table_columns = {}

    previous_row = nil
    previous_column = nil

    self.transaction do
      CSV.read(csv_file, headers: true, return_headers: true).each do |row|
        if row.header_row?
          row.each do |header, value|
            table_columns[header] = self.columns.
              find_or_create_by!(
                name: header,
                organization_id: self.organization_id,
                kind: 0,
                previous_column: previous_column,
              )

            previous_column = table_columns[header]
          end
        else
          previous_row = self.rows.create!(
            previous_row: previous_row,
            organization_id: self.organization_id,
          )

          row.each_with_index do |(header, value), index|
            self.cells.create!(
              column: table_columns[header],
              row: previous_row,
              value: value,
              organization_id: self.organization_id,
            )
          end
        end
      end
    end
  end

  def add_row(row_npi = nil, values = {})
    last_row = self.rows_in_order.last
    new_row = self.rows.create!(
      previous_row: last_row,
      organization_id: self.organization_id,
      npi: row_npi,
    )
    self.columns.each do |column|
      new_row.cells.create!(
        table: self,
        column: column,
        value: values[column.name],
        organization_id: self.organization_id,
        )
    end
  end
end