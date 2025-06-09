class FundamentoDeviseMailer < Devise::Mailer
  before_action :add_inline_attachment!, only: [:invitation_instructions]

  protected

  def subject_for(key)
    return super unless key == :invitation_instructions

    "#{resource.invited_by.display_name} invited you to #{resource.organization.name}, an organization on Fundamento."
  end

  def headers_for(action, opts)
    headers = super

    return headers unless action == :invitation_instructions

    headers[:reply_to] = "#{resource.invited_by.display_name} <#{resource.invited_by.email}>"
    headers[:from] = "#{resource.invited_by.display_name} via Fundamento <no-reply@mail.fundamento.cloud>"

    headers
  end
end