class Tables::Row < ApplicationRecord
  include NpiOrdering

  self.table_name = :table_rows

  # See the note in Tables::Cell.
  audited enabled: false

  include Tables::RecordsChanges

  belongs_to :organization
  belongs_to :table, touch: true

  belongs_to :previous_row, class_name: "Tables::Row", optional: true
  has_one :next_row, class_name: "Tables::Row", foreign_key: "previous_row_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validate :within_table_row_limit, on: :create

  # dependent: :delete_all wipes the cells from a before_destroy callback, so the values
  # have to be captured ahead of it. Between two snapshots this event is the only place a
  # deleted row's data survives.
  before_destroy :capture_values_for_change_event, prepend: true

  private

  def capture_values_for_change_event
    @deleted_values = cells.pluck(:column_id, :value).to_h
  end

  def within_table_row_limit
    return if table.blank?
    # Bulk paths (import, restore) check the total up front; the cached counter is stale
    # inside their loops, so skip the per-record check there.
    return if Tables::ChangeRecorder.suppressed?(table)
    return if table.rows.count < Table::MAX_ROWS

    errors.add(:base, "table cannot have more than #{Table::MAX_ROWS} rows")
  end

  def table_change_events_for(action)
    case action
    when :create
      [[:row_inserted, { row_id: id, previous_row_id: previous_row_id }]]
    when :update
      return [] unless saved_change_to_previous_row_id?

      before, after = saved_change_to_previous_row_id
      [[:row_moved, { row_id: id, before: before, after: after }]]
    else
      [[:row_deleted, { row_id: id, previous_row_id: previous_row_id, values: @deleted_values || {} }]]
    end
  end
end
