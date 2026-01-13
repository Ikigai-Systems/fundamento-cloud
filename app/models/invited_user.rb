class InvitedUser < ApplicationRecord
  include NpiOrdering

  devise :invitable, :database_authenticatable

  belongs_to :organization

  validates_presence_of :first_name
  validates_presence_of :last_name

  # Tells devise_invitable that each pair (email, organization_id) is a separate invitation
  def self.invite_key
    { email: Devise.email_regexp, organization_id: String }
  end
end
