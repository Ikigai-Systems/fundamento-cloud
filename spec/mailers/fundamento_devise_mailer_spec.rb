require "rails_helper"

RSpec.describe FundamentoDeviseMailer, type: :mailer do
  fixtures :organizations, :users

  describe "#invitation_instructions" do
    let(:organization) { organizations(:is) }
    let(:inviter) { users(:pawel) }
    let(:invitation) { InvitedUser.invite!({ email: "new@example.com", organization: organization }, inviter) }
    let(:mail) { ActionMailer::Base.deliveries.last }
    let(:html) { mail.html_part&.body&.decoded || mail.body.decoded }

    before do
      ActionMailer::Base.deliveries.clear
      invitation
    end

    it "is sent to the invited address" do
      expect(mail.to).to eq(["new@example.com"])
    end

    it "names the inviter and the organization in the subject" do
      expect(mail.subject).to eq("#{inviter.display_name} invited you to #{organization.name}, an organization on Fundamento.")
    end

    it "is sent on behalf of the inviter, who gets the replies" do
      expect(mail[:from].to_s).to include("#{inviter.display_name} via Fundamento")
      expect(mail.reply_to).to eq([inviter.email])
    end

    it "links to the acceptance page with the raw token" do
      expect(html).to include(CGI.escapeHTML("invitation_token=#{invitation.raw_invitation_token}"))
    end

    it "states until when the invitation can be accepted" do
      expect(html).to include(I18n.l(invitation.invitation_due_at, format: :"devise.mailer.invitation_instructions.accept_until_format"))
    end

    it "doesn't expose the stored token digest" do
      expect(html).not_to include(invitation.invitation_token)
    end
  end
end
