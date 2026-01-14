email = command_options.try(:[], "email")

invited_user = InvitedUser.find_by_email(email)

if invited_user && invited_user.invitation_token.present?
  # Generate a new raw token for testing (raw_invitation_token is only available at creation time)
  # This is safe for testing as we're regenerating the token
  raw_token, encrypted_token = Devise.token_generator.generate(InvitedUser, :invitation_token)
  invited_user.update_column(:invitation_token, encrypted_token)

  # Generate the invitation acceptance URL using Rails route helpers
  Rails.application.routes.url_helpers.accept_invited_user_invitation_url(
    invitation_token: raw_token,
    host: Rails.application.config.action_mailer.default_url_options.fetch(:host, "localhost:4000")
  )
else
  raise "InvitedUser not found or invitation token not present for email: #{email}"
end
