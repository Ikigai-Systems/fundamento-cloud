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
    self.resource = resource_class.find_by_invitation_token(params.dig(:invited_user, :invitation_token), true)

    if resource.nil?
      flash[:alert] = "This invitation link is no longer valid." if is_flashing_format?
      return redirect_to new_user_session_path
    end

    set_form_state_from_resource

    # Verify current user email matches invitation
    if current_user.present? && current_user.email != resource.email
      flash[:alert] = "You must be signed in as #{resource.email} to accept this invitation" if is_flashing_format?
      return redirect_to accept_invited_user_invitation_path(invitation_token: params.dig(:invited_user, :invitation_token))
    end

    invitation = resource.current_invitation

    user = User.find_or_create_by!(email: resource.email) do |new_user|
      # Passwordless mode - no password set, user will login via magic link
      def new_user.password_required?
        false
      end
    end

    OrganizationMembership.find_or_create_by!(organization_id: invitation.organization_id, user_id: user.id) do |organization_membership|
      organization_membership.role = :member
    end

    invitation.update!(invitation_accepted_at: Time.current, invitation_token: nil)

    user.skip_confirmation!
    user.update!(confirmation_token: nil)

    user.after_database_authentication
    sign_in(:user, user)

    remember_organization(invitation.organization)
    flash[:notice] = "Welcome to #{invitation.organization.name}!" if is_flashing_format?
    respond_with user, location: after_accept_path_for(user)
  end

  protected

  # The gem reads this as `current_inviter`, so it has to return the user as well as require one.
  def authenticate_inviter!
    authenticate_user!(force: true)
    current_user
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:invite, keys: [:organization_id])
  end

  # The organization travels with the invitation (stored in devise_invitations.organization_id).
  # Inviting again is a resend: the earlier link for the same email and organization stops working.
  def invite_resource(&block)
    revoke_pending_invitations(invite_params[:email], invite_params[:organization_id])

    resource_class.invite!(
      invite_params.slice(:email),
      current_inviter,
      invitation_data: { organization_id: invite_params[:organization_id] },
      &block
    )
  end

  def revoke_pending_invitations(email, organization_id)
    resource_class.pending_invitations_for(email: email.to_s.strip.downcase)
      .select { |invitation| invitation.organization_id == organization_id }
      .each { |invitation| invitation.update!(revoked_at: Time.current, invitation_token: nil) }
  end

  def after_invite_path_for(inviter, resource)
    organization_path(@organization)
  end

  def pundit_user
    if instance_variable_defined?(:@organization) && @organization.persisted?
      PolicyUserContext.new(current_user, @organization)
    else
      super
    end
  end

  def set_form_state_from_resource
    @organization = resource.current_invitation.organization
    @invited_email = resource.email
    @existing_user = User.find_by(email: @invited_email)

    if current_user.present? && current_user.email != @invited_email
      @state = :wrong_user_logged_in
    elsif @existing_user.present? && @organization.users.include?(@existing_user)
      @state = :already_member
    elsif current_user.present? && current_user.email == @invited_email
      @state = :logged_in_ready
    elsif @existing_user.present?
      @state = :existing_user_not_logged_in
    else
      @state = :new_user
    end
  end
end
