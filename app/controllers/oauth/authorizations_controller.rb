# frozen_string_literal: true

class Oauth::AuthorizationsController < Doorkeeper::AuthorizationsController
  layout "oauth"

  before_action :ensure_organization_selected!, only: [:new, :create]

  private

  # If the user has one org, auto-select it. If they have multiple, send them
  # to the org picker which stores the choice in session and redirects back here.
  def ensure_organization_selected!
    memberships = current_resource_owner.organization_memberships

    if memberships.one?
      session[:oauth_organization_membership_id] = memberships.first.id
    elsif session[:oauth_organization_membership_id].blank?
      redirect_to oauth_pick_organization_path(return_to: request.fullpath)
    end
  end
end
