# frozen_string_literal: true

class OrganizationsController < ApplicationController
  include EnsureOrganization

  skip_before_action :ensure_organization_exists, only: [:new, :create]
  skip_before_action :select_current_organization

  after_action :verify_authorized

  before_action :load_organization, except: [:new, :index, :create]

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
      OrganizationMembership.create!(
        organization: @organization,
        user: current_user,
        role: :manager,
      )

      if current_user.organizations.count > 1
        redirect_to @organization, notice: 'Organization was successfully created.'
      else
        redirect_to @organization.spaces.first, notice: 'Welcome to your Fundamento organization.'
      end
    else
      render :new
    end
  end

  def update
    authorize @organization, :update?

    if @organization.update(organization_params)
      redirect_to @organization, notice: 'Organization was successfully updated.'
    else
      render :edit
    end
  end

  def show
    authorize @organization, :show?
  end

  def edit
    authorize @organization, :update?
  end

  def select
    authorize @organization, :select?

    cookies.encrypted[:organization_id] = @organization.id

    # Pick a stable, non-archived space to land on. Falls back to any space
    # (extreme edge case where every space is archived).
    default_space = @organization.spaces.without_archived.order(:name).first ||
                    @organization.spaces.order(:name).first

    redirect_to space_path(default_space), notice: "You've been switched to #{@organization.name}."
  end

  def destroy
    authorize @organization, :destroy?

    @organization.destroy!

    redirect_to organizations_path, notice: "Organization was removed."
  end

  private

  def organization_params
    params.require(:organization).permit(:name)
  end

  def load_organization
    @organization = current_user.organizations.find(params[:id])
  end

  def pundit_user
    if instance_variable_defined?(:@organization) && @organization.persisted?
      PolicyUserContext.new(current_user, @organization)
    else
      super
    end
  end
end