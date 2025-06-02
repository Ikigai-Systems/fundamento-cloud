class ApplicationMailer < ActionMailer::Base
  default from: "no-reply@mail.fundamento.cloud",
          reply_to: "pawel@fundamento.it"

  layout "mailer"
end
