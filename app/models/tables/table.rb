require "csv"

class Tables::Table < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  belongs_to :parent, polymorphic: true

  has_many :columns, class_name: "Tables::Column", dependent: :delete_all
  has_many :rows, class_name: "Tables::Row", dependent: :delete_all
  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validates_presence_of :name

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

    rows_in_order.map do |row|
      if evaluate_formulas
        current_row_values = columns_in_order.each_with_object({}) do |column, hash|
          hash[column.name] = cells_by_rows_and_columns.dig([row.id, column.id])&.value
        end

        additional_context = {
          "currentRow" => current_row_values
        }

        columns_in_order.each_with_object({}) do |column, hash|
          hash[column.name] = cells_by_rows_and_columns.dig([row.id, column.id])&.evaluate_value(additional_context)
        end
      else
        columns_in_order.each_with_object({}) do |column, hash|
          hash[column.name] = cells_by_rows_and_columns.dig([row.id, column.id])&.value
        end
      end
    end
  end

  def import_from_csv(csv_file)
    # First ensure table is empty as this code assumes that
    assert self.cells.count.zero?
    assert self.rows.count.zero?
    assert self.columns.count.zero?

    table_columns = {}

    previous_row = nil
    previous_column = nil

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