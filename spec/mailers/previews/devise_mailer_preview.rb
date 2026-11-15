# test/mailers/previews/devise_mailer_preview.rb
class DeviseMailerPreview < ActionMailer::Preview
  # Creates a real (unsent) invitation each time it is opened; InvitationPurgeJob removes them later.
  def invitation_instructions
    invitee = User.invite!(
      { email: "test@example.com", skip_invitation: true },
      User.first,
      invitation_data: { organization_id: Organization.first.id }
    )

    FundamentoDeviseMailer.invitation_instructions(invitee, invitee.raw_invitation_token)
  end

  def reset_password_instructions
    token = "dummy_token"

    FundamentoDeviseMailer.reset_password_instructions(User.first, token)
  end

  def magic_link
    token = "dummy_token"

    FundamentoDeviseMailer.magic_link(User.first, token, true)
  end
end
