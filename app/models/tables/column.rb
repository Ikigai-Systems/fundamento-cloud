class Tables::Column < ApplicationRecord
  self.table_name = :table_columns

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"

  belongs_to :previous_column, class_name: "Tables::Column", optional: true
  has_one :next_column, class_name: "Tables::Column", foreign_key: "previous_column_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all

  validates_presence_of :name

  enum :kind, [:string, :integer, :decimal, :datetime, :date, :formula, :long_text, :select, :multi_select, :url, :checkbox], scopes: false, validate: true

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
    else
      :string
    end
  end
end