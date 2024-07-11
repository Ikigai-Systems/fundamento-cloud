# frozen_string_literal: true

class OrganizationsController < ApplicationController
  skip_before_action :ensure_organization_exists, only: [:new, :create]

  def new
    @organization = Organization.new
  end

  def index
    @organizations = current_user.organizations
  end

  def create
    @organization = current_user.organizations.new(organization_params)

    if @organization.save
      redirect_to @organization, notice: 'Organization was successfully created.'
    else
      render :new
    end
  end

  def show
    @organization = current_user.organizations.find_by_id(params[:id])
  end

  def edit
    @organization = current_user.organizations.find_by_id(params[:id])

    render :new
  end

  private

  def organization_params
    params.require(:organization).permit(:name)
  end

end