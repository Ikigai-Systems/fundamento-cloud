class PublicLinkMailerPreview < ActionMailer::Preview
  def invitation_instructions
    pundit_user = PolicyUserContext.new(OrganizationMembership.last)

    # Development data has no public links; an unsaved one is enough to render the mail.
    public_link = PublicLink.last || PublicLink.new(id: "preview", object: Document.first)

    PublicLinkMailer.with(
      pundit_user: pundit_user,
    ).invitation_instructions(public_link, "somebody@gmail.com")
  end
end
