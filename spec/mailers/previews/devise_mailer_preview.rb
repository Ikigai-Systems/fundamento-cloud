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

  def confirmation_instructions
    FundamentoDeviseMailer.confirmation_instructions(User.first, "dummy_token")
  end

  def reset_password_instructions
    FundamentoDeviseMailer.reset_password_instructions(User.first, "dummy_token")
  end

  def magic_link
    FundamentoDeviseMailer.magic_link(User.first, "dummy_token", true)
  end

  def password_change
    FundamentoDeviseMailer.password_change(User.first)
  end

  def email_changed
    FundamentoDeviseMailer.email_changed(User.first)
  end
end
