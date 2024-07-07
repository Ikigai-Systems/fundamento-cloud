class Organization < ApplicationRecord
  has_many User, as: :users
end
