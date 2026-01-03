class Tables::Row < ApplicationRecord
  include NpiOrdering

  self.table_name = :table_rows

  belongs_to :organization
  belongs_to :table, touch: true

  belongs_to :previous_row, class_name: "Tables::Row", optional: true
  has_one :next_row, class_name: "Tables::Row", foreign_key: "previous_row_id"

  has_many :cells, class_name: "Tables::Cell", dependent: :delete_all
end