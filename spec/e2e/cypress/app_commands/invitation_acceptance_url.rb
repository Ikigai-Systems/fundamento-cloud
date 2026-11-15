email = command_options.try(:[], "email")

# The invitation's raw token is only available when it is created, so issue a fresh one for the
# pending invitation, without sending another mail. The earlier link stops working, as on a resend.
digest = DeviseInvitable::Invitation.digest_for("User", { "email" => email.to_s.strip.downcase })
invitation = DeviseInvitable::Invitation.pending.where(invite_key_digest: digest).order(:id).last

raise "No pending invitation for email: #{email}" unless invitation

inviter = invitation.invited_by
organization_id = invitation.organization_id
invitation.update!(revoked_at: Time.current, invitation_token: nil)

user = User.invite!({ email: email, skip_invitation: true }, inviter, invitation_data: { organization_id: organization_id })
# The validity period starts when the invitation is sent, and nothing was sent.
user.current_invitation.update!(invitation_sent_at: Time.current)

Rails.application.routes.url_helpers.accept_invited_user_invitation_url(
  invitation_token: user.raw_invitation_token,
  host: Rails.application.config.action_mailer.default_url_options.fetch(:host, "localhost:4000")
)
