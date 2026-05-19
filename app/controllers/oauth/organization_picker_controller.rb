# frozen_string_literal: true

# Shown during the OAuth authorization flow when the user belongs to more than one
# organization. The user selects which org to grant the MCP client access to, and we
# store the choice in the session before redirecting back to the authorization endpoint.
class Oauth::OrganizationPickerController < ApplicationController
  before_action :authenticate_user!

  def show
    @memberships = current_user.organization_memberships.includes(:organization).order("organizations.name")
    @return_to = params[:return_to]
    @oauth_state = params[:oauth_state]
  end

  def create
    membership_id = params[:organization_membership_id]
    membership = current_user.organization_memberships.find_by(id: membership_id)

    unless membership
      redirect_to oauth_pick_organization_path(return_to: params[:return_to], oauth_state: params[:oauth_state]),
        alert: "Please select an organization."
      return
    end

    session["oauth_organization_membership_#{params[:oauth_state]}"] = membership.id

    redirect_to params[:return_to] || root_path
  end
end
