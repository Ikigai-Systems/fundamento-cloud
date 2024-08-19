class Tables::Cell < ApplicationRecord
  self.table_name = :table_cells

  belongs_to :organization
  belongs_to :table, class_name: "Tables::Table"
  belongs_to :column, class_name: "Tables::Column"
  belongs_to :row, class_name: "Tables::Row"
end