class Tables::Column < ApplicationRecord
  self.table_name = :table_columns

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"

  belongs_to :previous_column, class_name: "Tables::Column", optional: true
  has_one :next_column, class_name: "Tables::Column", foreign_key: "previous_column_id"

  has_many :cells, class_name: "Tables::Cell"

  validates_presence_of :name

  enum :kind, [:string, :integer, :decimal, :datetime, :date, :formula], scopes: false, validate: true
end