# frozen_string_literal: true

# The organization's pending invitations: revoke one, or send it again (which kills the earlier link).
class OrganizationInvitationsController < ApplicationController
  before_action :load_organization
  before_action :authorize_invite
  before_action :load_invitation

  after_action :verify_authorized

  def destroy
    @invitation.update!(revoked_at: Time.current, invitation_token: nil)

    redirect_to organization_path(@organization), notice: "Invitation for #{@invitation.email} was revoked."
  end

  def resend
    User.invite_to_organization!(email: @invitation.email, organization_id: @organization.id, invited_by: current_user)

    redirect_to organization_path(@organization), notice: "Invitation sent again to #{@invitation.email}."
  end

  private

  def load_organization
    @organization = current_user.organizations.find(params[:organization_id])
  end

  def authorize_invite
    authorize @organization, :invite_user?
  end

  def load_invitation
    @invitation = @organization.listed_invitations.find(params[:id])
  end

  def pundit_user
    PolicyUserContext.new(current_user, @organization)
  end
end
