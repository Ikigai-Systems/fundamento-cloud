# frozen_string_literal: true

class OrganizationUsersController < ApplicationController
  skip_before_action :select_current_organization

  before_action :load_organization_user, only: [:promote, :demote, :destroy]

  def new
    @organization_user = current_organization.organization_users.new
    @organization_user.user = User.new

    authorize @organization_user, :create?
  end

  def create
    @organization_user = current_organization.organization_users.new(create_params)

    authorize @organization_user, :create?

    if @organization_user.save
      redirect_to organization_path(current_organization), notice: 'User was successfully created.'
    else
      render :new
    end
  end

  def destroy
    authorize @organization_user, :destroy?

    if current_user.id.to_s == @organization_user.user_id.to_s
      redirect_to @organization_user.organization, notice: "You can't remove yourself from the organization."
      return
    end

    @organization_user.destroy!

    redirect_to @organization_user.organization, notice: 'User was removed from the organization.'
  end

  def promote
    authorize @organization_user, :promote?

    @organization_user.update!(role: :manager)

    redirect_to @organization_user.organization, notice: 'User was promoted to manager.'
  end

  def demote
    authorize @organization_user, :demote?

    if current_user.id.to_s == @organization_user.user_id.to_s
      redirect_to @organization_user.organization, notice: "You can't demote yourself."
      return
    end

    @organization_user.update!(role: :member)

    redirect_to @organization_user.organization, notice: 'Manager was demoted to member.'
  end

  private

  def load_organization_user
    @organization_user = OrganizationUser.find_by_param!(params[:npi])
  end

  def create_params
    params.require(:organization_user).permit(
      user_attributes: [:email, :first_name, :last_name, :password, :password_confirm]
    )
  end
end