# frozen_string_literal: true

class InvitedUsers::InvitationsController < Devise::InvitationsController
  before_action :configure_permitted_parameters

  def new
    @organization = current_user.organizations.find(params[:organization_id])

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

  def edit
    set_form_state_from_resource
    super
  end

  def update
    super do |resource|
      set_form_state_from_resource

      # Verify current user email matches invitation
      if current_user.present? && current_user.email != resource.email
        flash[:alert] = "You must be signed in as #{resource.email} to accept this invitation" if is_flashing_format?
        # FIXME: this doesn't work as there's no route for invited_user
        respond_with(resource)
        # redirect_to invitation_path(resource, invitation_token: params[:invitation_token])
        return
      end

      if resource.errors.empty?
        # Find or create User directly (NOT through has_many :through to avoid auto-creating OrganizationUser with wrong role)
        user = User.find_or_create_by!(email: resource.email) do |new_user|
          # Passwordless mode - no password set, user will login via magic link
          # Names will be auto-derived from email by User model's before_validation callback
          def new_user.password_required?
            # Turn off password validation for this object
            false
          end
        end

        # Explicitly create OrganizationUser with member role
        OrganizationMembership.find_or_create_by!(organization_id: resource.organization_id, user_id: user.id) do |organization_membership|
          organization_membership.role = :member
        end

        # Sign in the user (since we're creating a separate User record, Devise can't auto-login)
        user.skip_confirmation!
        user.update!(confirmation_token: nil)

        user.after_database_authentication
        sign_in(:user, user)

        # Destroy the invited user record
        resource.destroy!

        cookies.encrypted[:organization_id] = resource.organization.id
        flash[:notice] = "Welcome to #{resource.organization.name}!" if is_flashing_format?
        respond_with user, location: after_accept_path_for(user)
        return # break out of super
      end
    end
  end

  protected

  def authenticate_inviter!
    current_user
  end

  # Permit the new params here.
  def configure_permitted_parameters
    # Passwordless flow - no additional params needed, names are auto-derived from email
    devise_parameter_sanitizer.permit(:accept_invitation, keys: [])
  end

  def after_invite_path_for(inviter, resource)
    organization_path(resource.organization)
  end

  def pundit_user
    if instance_variable_defined?(:@organization) && @organization.persisted?
      PolicyUserContext.new(current_user, @organization)
    else
      super
    end
  end

  def set_form_state_from_resource
    @organization = resource.organization
    @invited_email = resource.email
    @existing_user = User.find_by(email: @invited_email)

    # State 1: User is logged in but email doesn't match
    if current_user.present? && current_user.email != @invited_email
      @state = :wrong_user_logged_in
      return
    end

    # State 2: User already in the organization
    if @existing_user.present? && @organization.users.include?(@existing_user)
      @state = :already_member
      return
    end

    # State 3: User logged in with correct email (ready to accept)
    if current_user.present? && current_user.email == @invited_email
      @state = :logged_in_ready
      return
    end

    # State 4: User exists but not logged in
    if @existing_user.present?
      @state = :existing_user_not_logged_in
      return
    end

    # State 5: New user (doesn't exist)
    @state = :new_user
  end
end