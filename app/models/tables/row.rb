class Tables::Row < ApplicationRecord
  self.table_name = :table_rows

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"
  belongs_to :column, class_name: "Tables::Column"

  belongs_to :previous_row, class_name: "Tables::Row", optional: true
  has_one :next_row, class_name: "Tables::Row", foreign_key: "previous_row_id"
end