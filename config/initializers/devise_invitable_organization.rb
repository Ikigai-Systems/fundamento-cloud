# devise_invitable's invitation model is a plain Active Record class; devise_invitations carries the
# organization an invitation is for (see User, before_invitation_created).
Rails.application.config.to_prepare do
  DeviseInvitable::Invitation.belongs_to :organization, optional: true
end
