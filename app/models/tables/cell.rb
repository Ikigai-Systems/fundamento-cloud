class Tables::Cell < ApplicationRecord
  self.table_name = :table_cells

  # Superseded by Tables::ChangeEvent, which records the same writes with row and column
  # context and is actually read by the product. audited is declared on ApplicationRecord
  # and was costing an extra INSERT on every cell edit for a log nothing consumed.
  audited enabled: false

  include Tables::RecordsChanges

  belongs_to :organization
  belongs_to :table, touch: true
  belongs_to :column, class_name: "Tables::Column"
  belongs_to :row, class_name: "Tables::Row"

  validate :value_within_length_limit

  private

  def value_within_length_limit
    return if value.nil? || value.length <= Table::MAX_CELL_VALUE_LENGTH

    errors.add(:value, "is longer than #{Table::MAX_CELL_VALUE_LENGTH} characters")
  end

  def table_change_events_for(action)
    case action
    when :create
      # Empty cells materialised alongside a new row or column are structural noise; the
      # row_inserted / column_added event already accounts for them.
      return [] if value.blank?

      [[:cell_updated, { row_id: row_id, column_id: column_id, before: nil, after: value }]]
    when :update
      return [] unless saved_change_to_value?

      before, after = saved_change_to_value
      [[:cell_updated, { row_id: row_id, column_id: column_id, before: before, after: after }]]
    else
      # Cells are only destroyed as part of destroying their row or column, and those
      # events carry the values.
      []
    end
  end
end
