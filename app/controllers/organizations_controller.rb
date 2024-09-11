# frozen_string_literal: true

class OrganizationsController < ApplicationController
  skip_before_action :ensure_organization_exists, only: [:new, :create]
  skip_before_action :select_current_organization

  after_action :verify_authorized

  def new
    @organization = Organization.new

    authorize @organization, :create?
  end

  def index
    @organizations = current_user.organizations.order(:name)

    authorize @organizations, :index?
  end

  def create
    @organization = current_user.organizations.new(organization_params)

    authorize @organization, :create?

    if @organization.save
      OrganizationUser.create!(
        organization: @organization,
        user: current_user
      )

      redirect_to @organization, notice: 'Organization was successfully created.'
    else
      render :new
    end
  end

  def update
    @organization = current_user.organizations.find_by_npi!(params[:npi])

    authorize @organization, :update?

    if @organization.update(organization_params)
      redirect_to @organization, notice: 'Organization was successfully updated.'
    else
      render :edit
    end
  end

  def show
    @organization = current_user.organizations.find_by_npi!(params[:npi])

    authorize @organization, :show?
  end

  def edit
    @organization = current_user.organizations.find_by_npi!(params[:npi])

    authorize @organization, :update?
  end

  def select
    @organization = current_user.organizations.find_by_npi!(params[:npi])

    authorize @organization, :select?

    cookies.encrypted[:organization_id] = @organization.id

    redirect_to space_path(@organization.spaces.first), notice: "You've been switched to #{@organization.name}."
  end

  def destroy
    @organization = current_user.organizations.find_by_npi!(params[:npi])

    authorize @organization, :destroy?

    @organization.destroy!

    redirect_to organizations_path, notice: "Organization was removed."
  end

  private

  def organization_params
    params.require(:organization).permit(:name)
  end
end