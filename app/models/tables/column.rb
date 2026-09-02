class Tables::Column < ApplicationRecord
  include NpiOrdering

  self.table_name = :table_columns

  # See the note in Tables::Cell.
  audited enabled: false

  include Tables::RecordsChanges

  # A column can span 50k rows; inlining every value into a single change event payload
  # is not viable. Beyond this, the previous snapshot is the recovery path.
  MAX_INLINE_DELETED_VALUES = 5_000

  belongs_to :organization
  belongs_to :table, touch: true

  belongs_to :previous_column, class_name: "Tables::Column", optional: true
  has_one :next_column, class_name: "Tables::Column", foreign_key: "previous_column_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validates_presence_of :name
  validate :within_table_column_limit, on: :create

  # dependent: :delete_all wipes the cells from a before_destroy callback, so the values
  # have to be captured ahead of it.
  before_destroy :capture_values_for_change_event, prepend: true

  enum :kind, [:string, :number, :decimal, :datetime, :date, :formula, :long_text, :select, :multi_select, :url, :checkbox, :people, :documents, :button, :multi_people], scopes: false, validate: true

  def self.to_kind(type)
    possible_type = type&.underscore

    if self.kinds.has_key?(possible_type)
      possible_type.to_sym
    else
      :string
    end
  end

  # Relinking three columns is one logical operation. Left partially applied it breaks the
  # chain, and Table#order_linked_list then raises IndexError, making the whole table
  # unreadable.
  def move_left
    next_column = table.columns.find_by(previous_column: self)
    previous_column = self.previous_column

    return if previous_column.nil? # todo: should be disabled on frontend

    transaction do
      self.update!(previous_column: previous_column.previous_column)
      previous_column.update!(previous_column: self)
      next_column.update!(previous_column: previous_column) if next_column.present?
    end
  end

  def move_right
    next_column = table.columns.find_by(previous_column: self)

    return if next_column.nil? # todo: should be disabled on frontend

    next_next_column = table.columns.find_by(previous_column: next_column)

    transaction do
      next_column.update!(previous_column: self.previous_column)
      self.update!(previous_column: next_column)
      next_next_column.update!(previous_column: self) if next_next_column.present?
    end
  end

  private

  def capture_values_for_change_event
    return unless Tables::ChangeRecorder.enabled?

    pairs = cells.where.not(value: nil).limit(MAX_INLINE_DELETED_VALUES + 1).pluck(:row_id, :value)

    @deleted_values_truncated = pairs.size > MAX_INLINE_DELETED_VALUES
    @deleted_values = pairs.first(MAX_INLINE_DELETED_VALUES).to_h
  end

  def within_table_column_limit
    return if table.blank?
    return if Tables::ChangeRecorder.suppressed?(table)
    return if table.columns.count < Table::MAX_COLUMNS

    errors.add(:base, "table cannot have more than #{Table::MAX_COLUMNS} columns")
  end

  def table_change_events_for(action)
    case action
    when :create
      [[:column_added, { column_id: id, name: name, kind: kind, previous_column_id: previous_column_id }]]
    when :update
      update_change_events
    else
      [[:column_removed, {
        column_id: id,
        name: name,
        kind: kind,
        previous_column_id: previous_column_id,
        values: @deleted_values || {},
        values_truncated: @deleted_values_truncated || false,
      }]]
    end
  end

  def update_change_events
    events = []

    if saved_change_to_name?
      before, after = saved_change_to_name
      events << [:column_renamed, { column_id: id, before: before, after: after }]
    end

    if saved_change_to_kind?
      before, after = saved_change_to_kind
      events << [:column_retyped, { column_id: id, name: name, before: before, after: after }]
    end

    if saved_change_to_previous_column_id?
      before, after = saved_change_to_previous_column_id
      events << [:column_moved, { column_id: id, name: name, before: before, after: after }]
    end

    reconfigured = saved_change_to_options? || saved_change_to_configuration? || saved_change_to_formula?
    if reconfigured
      events << [:column_reconfigured, {
        column_id: id,
        name: name,
        before: {
          options: saved_change_to_options ? saved_change_to_options.first : options,
          configuration: saved_change_to_configuration ? saved_change_to_configuration.first : configuration,
          formula: saved_change_to_formula ? saved_change_to_formula.first : formula,
        },
        after: { options: options, configuration: configuration, formula: formula },
      }]
    end

    events
  end
end
