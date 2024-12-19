# frozen_string_literal: true

class OrganizationUsersController < ApplicationController
  skip_before_action :select_current_organization

  before_action :load_organization_user, only: [:promote, :demote, :destroy, :change_password, :update]
  before_action :ensure_turbo_request, only: [:change_password]

  def new
    @organization_user = current_organization.organization_users.new
    @organization_user.user = User.new

    authorize @organization_user, :create?
  end

  def create
    @organization_user = current_organization.organization_users.new(create_params)

    authorize @organization_user, :create?

    user = User.find_by_email(@organization_user.user.email)
    if user.present?
      @organization_user.user = user
    end

    if @organization_user.save
      redirect_to organization_path(current_organization), notice: 'User was successfully created.'
    else
      @organization_user.user.clean_up_passwords if @organization_user.user.respond_to?(:clean_up_passwords)
      # @minimum_password_length = @organization_user.user.password_length.min if @organization_user.user.validatable?
      render :new
    end
  end

  def change_password
    authorize @organization_user, :change_password?
  end

  def update
    authorize @organization_user, :change_password?
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
      :organization_id,
      user_attributes: [:email, :first_name, :last_name, :password, :password_confirmation]
    )
  end

  def ensure_turbo_request
    redirect_to @organization_user.organization unless turbo_frame_request?
  end
end