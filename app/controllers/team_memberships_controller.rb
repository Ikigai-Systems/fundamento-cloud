# frozen_string_literal: true

class TeamMembershipsController < ApplicationController
  def new
    @team = current_organization.teams.find(params[:team_id])
    @team_membership = current_organization.team_memberships.new(team: @team)
  end

  def create
    @team = current_organization.teams.find(create_params[:team_id])

    create_params[:user_ids].each do |user_id|
      @team_membership = current_organization.team_memberships.find_or_initialize_by(team: @team, user_id: user_id)
      @team_membership.save!
    end

    redirect_to @team_membership.team, notice: 'Users were added to the team.'
  end

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

  protected

  def create_params
    params.require(:team_membership).permit(:team_id, user_ids: [])
  end
end