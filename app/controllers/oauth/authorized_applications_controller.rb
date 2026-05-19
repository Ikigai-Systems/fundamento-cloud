# frozen_string_literal: true

class Oauth::AuthorizedApplicationsController < ApplicationController
  include EnsureOrganization

  def index
    membership = current_organization_membership
    @tokens = Doorkeeper::AccessToken
      .where(resource_owner_id: current_user.id,
             organization_membership_id: membership.id,
             revoked_at: nil)
      .includes(:application)
      .order(created_at: :desc)
  end

  def destroy
    membership = current_organization_membership
    token = Doorkeeper::AccessToken.find_by!(
      id: params[:id],
      resource_owner_id: current_user.id,
      organization_membership_id: membership.id
    )
    token.update_column(:revoked_at, Time.current)

    redirect_to oauth_authorized_applications_path, notice: "Access token has been revoked."
  end
end
