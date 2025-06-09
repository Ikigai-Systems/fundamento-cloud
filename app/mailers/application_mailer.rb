class ApplicationMailer < ActionMailer::Base
  FROM_ADDRESS = "no-reply@mail.fundamento.cloud"

  default from: FROM_ADDRESS,
          reply_to: "pawel@fundamento.it"

  layout "mailer"

  protected

  def add_logo_attachment!
    attachments.inline["logo.png"] = File.read(Rails.root.join("app", "assets", "images", "fundamento-logo.png"))
  end
end
