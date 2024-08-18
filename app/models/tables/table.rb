class Tables::Table < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  belongs_to :parent, polymorphic: true
end