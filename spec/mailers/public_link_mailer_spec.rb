require "rails_helper"

RSpec.describe PublicLinkMailer, type: :mailer do
  fixtures :organizations, :users, :organization_memberships, :documents, :spaces

  describe "#invitation_instructions" do
    let(:membership) { organization_memberships(:om_is_pawel) }
    let(:document) { Document.first }
    let(:public_link) { PublicLink.new(id: "preview", object: document) }
    let(:mail) do
      described_class.with(pundit_user: PolicyUserContext.new(membership))
                     .invitation_instructions(public_link, "reader@example.com")
    end

    it "names the sender and the document, not an organization" do
      expect(mail.subject).to eq("#{membership.display_name} invited you to review the document #{document.title} on Fundamento.")
    end
  end
end
