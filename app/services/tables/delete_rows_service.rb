class Tables::DeleteRowsService

  def initialize(table)
    @table = table
  end

  def call(rows_to_delete: nil)
    @table.transaction do
      if rows_to_delete.blank?
        @table.cells.delete_all
        @table.rows.delete_all
      else
        rows_to_delete.each do |row_to_delete|
          next_row = row_to_delete.next_row
          next_row&.update(previous_row: row_to_delete.previous_row)

          row_to_delete.destroy!
        end
      end
    end
  end
end