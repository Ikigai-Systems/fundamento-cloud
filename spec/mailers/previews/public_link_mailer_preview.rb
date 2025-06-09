# test/mailers/previews/devise_mailer_preview.rb
class PublicLinkMailerPreview < ActionMailer::Preview
  def invitation_instructions
    pundit_user = PolicyUserContext.new(OrganizationUser.last)

    public_link = PublicLink.last

    PublicLinkMailer.with(
      pundit_user: pundit_user,
    ).invitation_instructions(public_link, "somebody@gmail.com")
  end
end
