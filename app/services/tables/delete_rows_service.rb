class Tables::DeleteRowsService

  def initialize(table)
    @table = table
  end

  def call
    @table.transaction do
      loop do
        row = @table.rows.first
        break if row.nil?
        next_row = row.next_row
        next_row.update(previous_row: row.previous_row) unless next_row.nil?
        row.destroy!
      end
    end
  end
end