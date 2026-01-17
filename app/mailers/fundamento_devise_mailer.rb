class FundamentoDeviseMailer < Devise::Passwordless::Mailer
  before_action :add_logo_attachment!, only: [:invitation_instructions]

  protected

  def subject_for(key)
    return super unless key == :invitation_instructions

    "#{resource.invited_by.display_name} invited you to #{resource.organization.name}, an organization on Fundamento."
  end

  def headers_for(action, opts)
    headers = super

    return headers unless action == :invitation_instructions

    headers[:reply_to] = email_address_with_name(resource.invited_by.email, resource.invited_by.display_name)

    headers[:from] = email_address_with_name(
      ApplicationMailer::FROM_ADDRESS,
      "#{resource.invited_by.display_name} via Fundamento"
    )

    headers
  end
end