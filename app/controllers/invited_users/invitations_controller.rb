# frozen_string_literal: true

class InvitedUsers::InvitationsController < Devise::InvitationsController
  skip_before_action :ensure_organization_exists
  skip_before_action :select_current_organization

  before_action :configure_permitted_parameters

  def new
    @organization = current_user.organizations.find_by_npi!(params[:organization_npi])

    authorize @organization, :invite_user?

    super
  end

  def create
    @organization = current_user.organizations.find(invite_params[:organization_id])

    authorize @organization, :invite_user?

    if @organization.users.where(email: invite_params[:email]).exists?
      redirect_to organization_path(@organization), notice: "User is already a member of this organization."
    else
      super
    end
  end

  def update
    super do |resource|
      if resource.errors.empty?
        user = resource.organization.users.find_or_create_by!(email: resource.email) do |new_user|
          new_user.first_name = resource.first_name
          new_user.last_name = resource.last_name
          new_user.encrypted_password = resource.encrypted_password

          def new_user.password_required?
            # Turn off password validation for this object
            false
          end
        end

        resource.organization.organization_users.find_or_create_by!(user_id: user.id) do |organization_user|
          organization_user.role = :member
        end

        # We finally destroy the invited user as we no longer need it
        resource.destroy!
      end
    end
  end

  def edit
    if (user = User.find_by(email: resource.email)).present?
      # There's already such user, so let's add it to the organization and accept the invitation
      OrganizationUser.find_or_create_by!(organization_id: resource.organization_id, user_id: user.id) do |organization_user|
        organization_user.role = :member
      end

      # We finally destroy the invited user as we no longer need it
      resource.destroy!

      redirect_to new_session_path(resource_name), notice: "You accepted the invitation to join #{resource.organization.name}, you can sign in now."
    else
      super
    end
  end

  protected

  def authenticate_inviter!
    authenticate_user!
  end

  # Permit the new params here.
  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:accept_invitation, keys: [:first_name, :last_name])
  end

  def after_invite_path_for(inviter, resource)
    organization_path(resource.organization)
  end
end