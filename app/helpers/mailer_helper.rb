module MailerHelper
  # A button that survives Outlook: the colour sits on the table cell, not on the link.
  def email_button(text, url)
    render "mailer/button", text: text, url: url
  end
end
