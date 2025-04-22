# frozen_string_literal: true

class Users::SignUpWithGoogleController < ApplicationController
  skip_before_action :ensure_organization_exists
  skip_before_action :select_current_organization
  skip_before_action :authenticate_user!

  def sign_up_with_google
    Sentry.capture_message("Attempt to sign up with Google", level: :info, extra: {
      ip_address: request.remote_ip
    }.merge(
      self.request.env.select { |k, v| k =~ /^HTTP_/ }
    ))

    flash[:warning] = "Sign up with Google is under construction, please use email registration in the meanwhile."
    redirect_to new_user_registration_path
  end
end