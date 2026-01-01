# frozen_string_literal: true

class TeamsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized, except: [:suggest_members]

  helper_method :team_memberships_to_multiselect_value

  def new
    @team = current_organization.teams.new

    authorize @team, :create?
  end

  def index
    @teams = current_organization.teams.order(:name)

    authorize @teams, :index?
  end

  def create
    @team = current_organization.teams.new(team_params)

    authorize @team, :create?

    if @team.save
      update_team_memberships!(@team, params[:team][:team_memberships])

      redirect_to @team, notice: 'Team was successfully created.'
    else
      render :new
    end
  end

  def update
    @team = current_organization.teams.find(params[:id])

    authorize @team, :update?

    if @team.update(team_params)
      update_team_memberships!(@team, params[:team][:team_memberships])

      redirect_to @team, notice: 'Team was successfully updated.'
    else
      render :edit
    end
  end

  def show
    @team = current_organization.teams.find(params[:id])

    authorize @team, :show?
  end

  def edit
    @team = current_organization.teams.find(params[:id])

    authorize @team, :update?
  end

  def destroy
    @team = current_organization.teams.find(params[:id])

    authorize @team, :destroy?

    @team.destroy!

    redirect_to teams_path, notice: "Team was removed."
  end

  def suggest_members
    query = params[:q]
    preselects = params[:preselects].split(",")

    @organization_users = current_organization.organization_users.query(query).map do |organization_user|
      {
        value: "#{organization_user.class}|#{organization_user.id}",
        text: organization_user.user.display_name
      }
    end

    render json: @organization_users.reject { preselects.include?(_1[:value]) }.sort_by { _1[:text] }
  end

  private

  def update_team_memberships!(team, team_memberships_param)
    memberships_to_destroy = team.team_memberships.index_by { [_1.member_type, _1.member_id.to_s] }

    team_memberships_param.select(&:present?).each do |membership|
      member_type, member_id = membership.split("|")

      if memberships_to_destroy.key?([member_type, member_id])
        # If the membership already exists, remove it from the list of memberships to destroy and keep it in the database
        memberships_to_destroy.delete([member_type, member_id])
      else
        # Membership does not exist but should so create it
        team.team_memberships.create!(
          organization: current_organization,
          member_type: member_type,
          member_id: member_id,
        )
      end
    end

    # Destroy any memberships that were not in the list of memberships to keep
    memberships_to_destroy.each_value(&:destroy!)
  end

  def team_memberships_to_multiselect_value(team)
    team.team_memberships.map do |membership|
      { value: "#{membership.member_type}|#{membership.member_id}", text: membership.display_name }
    end.to_json
  end

  def team_params
    params.require(:team).permit(:name, :shortcut)
  end

end