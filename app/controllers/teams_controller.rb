# frozen_string_literal: true

class TeamsController < ApplicationController
  def new
    @team = current_organization.teams.new
  end

  def index
    @teams = current_organization.teams.order(:name)
  end

  def create
    @team = current_organization.teams.new(team_params)

    if @team.save
      redirect_to @team, notice: 'Team was successfully created.'
    else
      render :new
    end
  end

  def update
    @team = current_organization.teams.find_by_id!(params[:id])

    if @team.update(team_params)
      redirect_to @team, notice: 'Team was successfully updated.'
    else
      render :edit
    end
  end

  def show
    @team = current_organization.teams.find_by_id!(params[:id])
  end

  def edit
    @team = current_organization.teams.find_by_id!(params[:id])
  end

  def destroy
    @team = current_organization.teams.find_by_id(params[:id])
    @team.destroy!

    redirect_to teams_path, notice: "Team was removed."
  end

  private

  def team_params
    params.require(:team).permit(:name, :shortcut)
  end

end