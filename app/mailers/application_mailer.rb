class ApplicationMailer < ActionMailer::Base
  FROM_ADDRESS = "no-reply@mail.fundamento.cloud"

  default from: email_address_with_name(FROM_ADDRESS, "Fundamento"),
          reply_to: email_address_with_name("pawel@fundamento.it", "Pawel from Fundamento")

  layout "mailer"

  protected

  def add_logo_attachment!
    attachments.inline["logo.png"] = File.read(Rails.root.join("app", "assets", "images", "fundamento-logo.png"))
  end
end
