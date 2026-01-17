# frozen_string_literal: true

class OrganizationMembershipsController < ApplicationController
  include EnsureOrganization

  before_action :load_organization_membership, only: [:promote, :demote, :destroy, :change_password, :update]
  before_action :ensure_turbo_request, only: [:change_password, :update]

  def new
    @organization_membership = current_organization.organization_memberships.new
    @organization_membership.user = User.new

    authorize @organization_membership, :create?
  end

  def create
    @organization_membership = current_organization.organization_memberships.new(create_params)
    @organization_membership.role = :member

    authorize @organization_membership, :create?

    user = User.find_by_email(@organization_membership.user.email)
    if user.present?
      @organization_membership.user = user
    end

    if @organization_membership.save
      redirect_to organization_path(current_organization), notice: 'User was successfully created.'
    else
      @organization_membership.user.clean_up_passwords if @organization_membership.user.respond_to?(:clean_up_passwords)
      # @minimum_password_length = @organization_membership.user.password_length.min if @organization_membership.user.validatable?
      render :new
    end
  end

  def change_password
    authorize @organization_membership, :change_password?
  end

  def update
    authorize @organization_membership, :change_password?

    user = @organization_membership.user
    def user.password_required?
      true
    end

    if user.update(update_params[:user_attributes].except(:id))
      render turbo_stream: turbo_stream.redirect_to(organization_path(current_organization))
    else
      user.errors.each do |error|
        @organization_membership.errors.import(error)
      end

      render :change_password
    end
  end

  def destroy
    authorize @organization_membership, :destroy?

    if current_user.id.to_s == @organization_membership.user_id.to_s
      redirect_to @organization_membership.organization, notice: "You can't remove yourself from the organization."
      return
    end

    @organization_membership.destroy!

    redirect_to @organization_membership.organization, notice: 'User was removed from the organization.'
  end

  def promote
    authorize @organization_membership, :promote?

    @organization_membership.update!(role: :manager)

    redirect_to @organization_membership.organization, notice: 'User was promoted to manager.'
  end

  def demote
    authorize @organization_membership, :demote?

    if current_user.id.to_s == @organization_membership.user_id.to_s
      redirect_to @organization_membership.organization, notice: "You can't demote yourself."
      return
    end

    @organization_membership.update!(role: :member)

    redirect_to @organization_membership.organization, notice: 'Manager was demoted to member.'
  end

  private

  def load_organization_membership
    @organization_membership = OrganizationMembership.find(params[:npi])
  end

  def create_params
    params.require(:organization_membership).permit(
      user_attributes: [:email, :first_name, :last_name, :password, :password_confirmation]
    )
  end

  def update_params
    params.require(:organization_membership).permit(
      user_attributes: [:id, :password, :password_confirmation]
    )
  end

  def ensure_turbo_request
    redirect_to @organization_membership.organization unless turbo_frame_request?
  end
end