class Space < ApplicationRecord
  belongs_to :organization

  has_many :documents

  validates_presence_of :name
end
