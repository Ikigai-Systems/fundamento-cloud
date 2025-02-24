# test/mailers/previews/devise_mailer_preview.rb
class DeviseMailerPreview < ActionMailer::Preview
  def invitation_instructions
    organization = Organization.new(name: "Test")

    user = User.first

    invited_user = InvitedUser.new(first_name: "Test", last_name: "User", email: "test@example.com")
    invited_user.organization = organization
    invited_user.invited_by = user
    invited_user.invitation_sent_at = Time.now

    token = "dummy_token"

    FundamentoDeviseMailer.invitation_instructions(invited_user, token)
  end
end
