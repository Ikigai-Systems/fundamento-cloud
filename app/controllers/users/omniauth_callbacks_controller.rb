class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token, only: :google_oauth2

  def google_oauth2
    auth = request.env["omniauth.auth"]
    @user = find_or_create_from_omniauth(auth)
    sign_in_and_redirect @user, event: :authentication
  end

  def failure
    redirect_to new_user_session_path, alert: t("devise.omniauth_callbacks.failure", kind: "Google", reason: failure_message)
  end

  private

  def find_or_create_from_omniauth(auth)
    identity = UserIdentity.find_by(provider: auth.provider, uid: auth.uid)
    return identity.user if identity

    user = User.find_by(email: auth.info.email)

    unless user
      user = User.create!(
        email: auth.info.email,
        first_name: auth.info.first_name,
        last_name: auth.info.last_name,
        confirmed_at: Time.current,
        password: Devise.friendly_token
      )
    end

    user.user_identities.create!(
      provider: auth.provider,
      uid: auth.uid,
      email: auth.info.email,
      name: auth.info.name,
      token_data: auth.credentials.to_h
    )

    user
  end
end
