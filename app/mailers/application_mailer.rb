class ApplicationMailer < ActionMailer::Base
  default from: "no-reply@outgoing.ikigai.systems",
          reply_to: "pawel@ikigai.systems"

  layout "mailer"
end
