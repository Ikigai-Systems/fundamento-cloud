class Tables::Table < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  belongs_to :parent, polymorphic: true

  has_many :columns, class_name: "Tables::Column", dependent: :delete_all

  validates_presence_of :name
end