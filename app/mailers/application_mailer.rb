class ApplicationMailer < ActionMailer::Base
  default from: "no-reply@mail.fundamento.cloud",
          reply_to: "pawel@fundamento.it"

  layout "mailer"

  protected

  def add_logo_attachment!
    attachments.inline["logo.png"] = File.read(Rails.root.join("app", "assets", "images", "fundamento-logo.png"))
  end
end
