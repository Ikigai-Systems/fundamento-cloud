class Organization < ApplicationRecord
  has_many :User, as: :users

  validates_presence_of :name
end
