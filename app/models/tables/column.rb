class Tables::Column < ApplicationRecord
  self.table_name = :table_columns

  belongs_to :organization
  belongs_to :table, touch: true

  belongs_to :previous_column, class_name: "Tables::Column", optional: true
  has_one :next_column, class_name: "Tables::Column", foreign_key: "previous_column_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validates_presence_of :name

  enum :kind, [:string, :number, :decimal, :datetime, :date, :formula, :long_text, :select, :multi_select, :url, :checkbox, :people, :documents, :button, :multi_people], scopes: false, validate: true

  def self.to_kind(type)
    possible_type = type&.underscore

    if self.kinds.has_key?(possible_type)
      possible_type.to_sym
    else
      :string
    end
  end

  def move_left
    next_column = table.columns.find_by(previous_column: self)
    previous_column = self.previous_column

    return if previous_column.nil? # todo: should be disabled on frontend

    self.update(previous_column: previous_column.previous_column)
    previous_column.update(previous_column: self)
    next_column.update(previous_column: previous_column) if next_column.present?
  end

  def move_right
    next_column = table.columns.find_by(previous_column: self)

    return if next_column.nil? # todo: should be disabled on frontend

    next_next_column = table.columns.find_by(previous_column: next_column)
    previous_column = self.previous_column

    next_column.update(previous_column: self.previous_column)
    self.update(previous_column: next_column)
    next_next_column.update(previous_column: self) if next_next_column.present?
  end
end