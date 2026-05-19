# frozen_string_literal: true

class Oauth::AuthorizedApplicationsController < ApplicationController
  include EnsureOrganization

  def index
    membership = current_organization_membership
    @applications = Doorkeeper::AccessToken
      .where(resource_owner_id: current_user.id,
             organization_membership_id: membership.id,
             revoked_at: nil)
      .includes(:application)
      .filter_map(&:application)
      .uniq
  end

  def destroy
    membership = current_organization_membership
    Doorkeeper::AccessToken
      .where(application_id: params[:id],
             resource_owner_id: current_user.id,
             organization_membership_id: membership.id)
      .update_all(revoked_at: Time.current)
    Doorkeeper::AccessGrant
      .where(application_id: params[:id],
             resource_owner_id: current_user.id)
      .update_all(revoked_at: Time.current)

    redirect_to oauth_authorized_applications_path, notice: "Application access has been revoked."
  end
end
