class PublicLinkPolicy < ApplicationPolicy
  def show?
    # If no allowed emails are configured, allow access to any authenticated user
    return true if record.allowed_emails.empty?

    # Check if the current user's email is in the allowed emails list
    record.allowed_emails.include?(user.email)
  end
end