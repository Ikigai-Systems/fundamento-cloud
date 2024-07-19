# frozen_string_literal: true

class OrganizationsController < ApplicationController
  skip_before_action :ensure_organization_exists, only: [:new, :create]
  skip_before_action :select_current_organization

  def new
    @organization = Organization.new
  end

  def index
    @organizations = current_user.organizations.order(:name)
  end

  def create
    @organization = current_user.organizations.new(organization_params)
    @organization_user = OrganizationUser.create(
      organization: @organization,
      user: current_user
    )

    if @organization.save && @organization_user.save
      redirect_to @organization, notice: 'Organization was successfully created.'
    else
      render :new
    end
  end

  def show
    @organization = current_user.organizations.find_by_id!(params[:id])
  end

  def edit
    @organization = current_user.organizations.find_by_id!(params[:id])

    render :new
  end

  def select
    @organization = current_user.organizations.find_by_id(params[:id])

    cookies.encrypted[:organization_id] = @organization.id

    redirect_to space_path(@organization.spaces.first), notice: "You've been switched to #{@organization.name}."
  end

  private

  def organization_params
    params.require(:organization).permit(:name)
  end

end