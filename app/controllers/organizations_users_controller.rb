# frozen_string_literal: true

class OrganizationsUsersController < ApplicationController
  def destroy
    organization_id, user_id = params[:id].split(",")

    organization = current_user.
      organizations.find(organization_id)

    if current_user.id.to_s == user_id
      redirect_to organization, notice: "You can't remove yourself from the organization."
      return
    end

    organization.organizations_users.
      find_by(organization_id: organization_id, user_id: user_id).
      destroy!

    redirect_to organization, notice: 'User was removed from the organization.'
  end
end