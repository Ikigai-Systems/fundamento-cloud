# frozen_string_literal: true

class TeamMembershipsController < ApplicationController
  after_action :verify_authorized

  def new
    @team = current_organization.teams.find(params[:team_id])

    authorize @team, :update?

    @team_membership = current_organization.team_memberships.new(team: @team)
  end

  def create
    @team = current_organization.teams.find(create_params[:team_id])

    authorize @team, :update?

    create_params[:user_ids].each do |user_id|
      @team_membership = current_organization.team_memberships.find_or_initialize_by(team: @team, user_id: user_id)
      @team_membership.save!
    end

    redirect_to @team_membership.team, notice: 'Users were added to the team.'
  end

  def destroy
    team_npi, user_id = params[:id].split(",")

    @team = current_organization.teams.find_by_npi!(team_npi)
    @team_membership = @team.team_memberships.find_by(user_id: user_id)

    authorize @team, :update?

    @team_membership.destroy!

    redirect_to @team, notice: 'User was removed from the team.'
  end

  protected

  def create_params
    params.require(:team_membership).permit(:team_id, user_ids: [])
  end
end