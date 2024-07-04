class Organization < ApplicationRecord
  has_many OrganizationUser, as: :users
end
