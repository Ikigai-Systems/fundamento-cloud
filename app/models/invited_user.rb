class InvitedUser < ApplicationRecord
  devise :invitable, :database_authenticatable

  belongs_to :organization
end
