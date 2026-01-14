class InvitedUser < ApplicationRecord
  include NpiOrdering

  devise :invitable, :database_authenticatable

  # We convert InvitedUser to User upon accepting the invitation so we don't want to sign in invited users
  # See InvitedUsers::InvitationsController#update for details
  self.allow_insecure_sign_in_after_accept = false

  # Passwordless invitations - new users don't set password, they login via magic link later
  self.require_password_on_accepting = false

  belongs_to :organization

  # Tells devise_invitable that each pair (email, organization_id) is a separate invitation
  def self.invite_key
    { email: Devise.email_regexp, organization_id: String }
  end
end
