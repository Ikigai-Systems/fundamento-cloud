class PublicLinkMailer < ApplicationMailer
  include Devise::Mailers::Helpers

  layout "email_with_logo"

  attr_accessor :pundit_user

  before_action :add_logo_attachment!, only: [:invitation_instructions]

  def invitation_instructions(public_link, invited_email)
    @public_link = public_link
    @pundit_user = params[:pundit_user]

    mail(to: invited_email, subject: subject_for(:invitation_instructions))
  end

  protected

  def subject_for(key)
    return super unless key == :invitation_instructions

    "#{params[:pundit_user].organization_user.display_name} invited you to #{@public_link.object.title}, an organization on Fundamento."
  end

  def headers_for(action, opts)
    headers = super

    return headers unless action == :invitation_instructions

    headers[:reply_to] = "#{resource.invited_by.display_name} <#{resource.invited_by.email}>"
    headers[:from] = "#{resource.invited_by.display_name} via Fundamento <no-reply@mail.fundamento.cloud>"

    headers
  end
end