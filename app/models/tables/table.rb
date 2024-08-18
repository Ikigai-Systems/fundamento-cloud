class Tables::Table < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  belongs_to :parent, polymorphic: true

  validates_presence_of :name
end