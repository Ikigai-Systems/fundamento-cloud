# frozen_string_literal: true

class Users::InvitationsController < Devise::InvitationsController
  before_action :configure_permitted_parameters

  protected

  def invite_resource
    # skip sending emails on invite
    super do |user|
      user.organizations = [CurrentOrganization.current_organization]
    end
  end

  # Permit the new params here.
  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:invite, keys: [:first_name, :last_name])
  end
end