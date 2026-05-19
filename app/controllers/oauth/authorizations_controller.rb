# frozen_string_literal: true

class Oauth::AuthorizationsController < Doorkeeper::AuthorizationsController
  layout "oauth"

  before_action :ensure_organization_selected!, only: [:new, :create]

  private

  # If the user has one org, auto-select it. If they have multiple, send them
  # to the org picker which stores the choice in session and redirects back here.
  # Session key is scoped to the OAuth state so each flow is independent.
  def ensure_organization_selected!
    memberships = current_resource_owner.organization_memberships

    if memberships.one?
      session[oauth_organization_membership_session_key] = memberships.first.id
    elsif session[oauth_organization_membership_session_key].blank?
      redirect_to oauth_pick_organization_path(return_to: request.fullpath, oauth_state: params[:state])
    end
  end

  def oauth_organization_membership_session_key
    "oauth_organization_membership_#{params[:state]}"
  end
end
