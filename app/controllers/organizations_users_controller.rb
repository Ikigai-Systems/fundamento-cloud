# frozen_string_literal: true

class OrganizationsUsersController < ApplicationController
  def destroy
    organization_id, user_id = params[:id].split(",")

    organization = current_user.
      organizations.find(organization_id)

    organization.organizations_users.
      find_by(organization_id: organization_id, user_id: user_id).
      destroy!

    redirect_to organization, notice: 'User was removed from the organization.'
  end
end