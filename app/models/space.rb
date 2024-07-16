class Space < ApplicationRecord
  belongs_to :organization

  has_many :documents
end
