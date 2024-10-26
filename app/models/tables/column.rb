class Tables::Column < ApplicationRecord
  self.table_name = :table_columns

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"

  belongs_to :previous_column, class_name: "Tables::Column", optional: true
  has_one :next_column, class_name: "Tables::Column", foreign_key: "previous_column_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validates_presence_of :name

  enum :kind, [:string, :integer, :decimal, :datetime, :date, :formula, :long_text, :select, :multi_select, :url, :checkbox, :people], scopes: false, validate: true

  def self.to_kind(type)
    case (type)
    when "number"
      :integer
    when "longText"
      :long_text
    when "select"
      :select
    when "date"
      :date
    when "multiSelect"
      :multi_select
    when "url"
      :url
    when "checkbox"
      :checkbox
    when "formula"
      :formula
    when "people"
      :people
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