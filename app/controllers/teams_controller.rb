# frozen_string_literal: true

class TeamsController < ApplicationController
  after_action :verify_authorized

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
      redirect_to @team, notice: 'Team was successfully created.'
    else
      render :new
    end
  end

  def update
    @team = current_organization.teams.find_by_npi!(params[:npi])

    authorize @team, :update?

    if @team.update(team_params)
      redirect_to @team, notice: 'Team was successfully updated.'
    else
      render :edit
    end
  end

  def show
    @team = current_organization.teams.find_by_npi!(params[:npi])

    authorize @team, :show?
  end

  def edit
    @team = current_organization.teams.find_by_npi!(params[:npi])

    authorize @team, :update?
  end

  def destroy
    @team = current_organization.teams.find_by_npi(params[:npi])

    authorize @team, :destroy?

    @team.destroy!

    redirect_to teams_path, notice: "Team was removed."
  end

  private

  def team_params
    params.require(:team).permit(:name, :shortcut)
  end

end