# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_permitted_parameters

  skip_before_action :ensure_organization_exists, only: %i[edit update]
  skip_before_action :select_current_organization, only: %i[edit update]

  def create
    build_resource(sign_up_params)

    if !Flipper.enabled?(:recaptcha) || (resource.validate && verify_recaptcha(model: resource))
      super
    else
      logger.warn(@_recaptcha_failure_reason) if defined?(@_recaptcha_failure_reason) && @_recaptcha_failure_reason.present? && Flipper.enabled?(:recaptcha_debug)

      clean_up_passwords resource
      set_minimum_password_length
      respond_with resource
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[first_name last_name])
  end

  def after_update_path_for(resource)
    sign_in_after_change_password? ? edit_registration_path(resource) : new_session_path(resource_name)
  end
end