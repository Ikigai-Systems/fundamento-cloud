Rails.application.config.to_prepare do
  DeviseInvitable::Invitation.belongs_to :organization, optional: true
end
