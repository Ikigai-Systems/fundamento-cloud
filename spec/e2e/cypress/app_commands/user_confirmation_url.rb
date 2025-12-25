email = command_options.try(:[], "email")

user = User.find_by_email(email)

if user && user.confirmation_token.present?
  # Generate the confirmation URL using Rails route helpers
  # This uses the user_confirmation_url helper provided by Devise
  Rails.application.routes.url_helpers.user_confirmation_url(
    confirmation_token: user.confirmation_token,
    host: ENV.fetch("CYPRESS_BASE_URL", "localhost:4000")
  )
else
  raise "User not found or confirmation token not present for email: #{email}"
end
