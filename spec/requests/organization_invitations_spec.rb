require "rails_helper"

RSpec.describe "OrganizationInvitations", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }

  before { ActionMailer::Base.deliveries.clear }

  def invite_to(email, organization, by)
    User.invite!({ email: email }, by, invitation_data: { organization_id: organization.id })
    DeviseInvitable::Invitation.pending.find_by!(email: email)
  end

  def mail_token(mail)
    html = mail.html_part&.body&.decoded || mail.body.decoded
    CGI.parse(URI.parse(html[/href="([^"]*invitation_token[^"]*)"/, 1].gsub("&amp;", "&")).query)["invitation_token"].first
  end

  describe "the list on the organization page" do
    it "shows pending invitations to a manager, with their actions" do
      invitation = invite_to("listed@example.com", is_org, pawel)
      sign_in(pawel)

      get organization_path(is_org)

      expect(response.body).to include("Pending invitations", "listed@example.com")
      expect(response.body).to include(resend_organization_invitation_path(is_org, invitation))
      expect(response.body).to include(organization_invitation_path(is_org, invitation))
    end

    it "shows no section when nothing is pending" do
      sign_in(pawel)

      get organization_path(is_org)

      expect(response.body).not_to include("Pending invitations")
    end

    it "leaves out revoked, accepted and other organizations' invitations" do
      revoked = invite_to("revoked@example.com", is_org, pawel)
      revoked.update!(revoked_at: Time.current, invitation_token: nil)
      accepted = invite_to("accepted@example.com", is_org, pawel)
      accepted.update!(invitation_accepted_at: Time.current, invitation_token: nil)
      invite_to("elsewhere@example.com", hc_org, pawel)
      sign_in(pawel)

      get organization_path(is_org)

      expect(response.body).not_to include("revoked@example.com", "accepted@example.com", "elsewhere@example.com")
    end

    it "labels an invitation past its expiry, which can still be sent again" do
      invitation = invite_to("late@example.com", is_org, pawel)
      invitation.update!(invitation_sent_at: (Devise.invite_for + 1.day).ago)
      sign_in(pawel)

      get organization_path(is_org)

      expect(response.body).to include("late@example.com", "Expired")
    end

    it "is not shown to a member who can't invite" do
      invite_to("hidden@example.com", is_org, pawel)
      sign_in(stefan)

      get organization_path(is_org)

      expect(response.body).not_to include("hidden@example.com")
    end
  end

  describe "DELETE /organizations/:organization_id/invitations/:id (revoke)" do
    it "revokes the invitation and its link stops working" do
      invitation = invite_to("revoke@example.com", is_org, pawel)
      token = mail_token(ActionMailer::Base.deliveries.last)
      expect(User.find_by_invitation_token(token, true)).to be_present
      sign_in(pawel)

      expect { delete organization_invitation_path(is_org, invitation) }
        .to change { is_org.invitations.pending.count }.by(-1)

      expect(response).to redirect_to(organization_path(is_org))
      expect(invitation.reload.revoked_at).to be_present
      expect(invitation.invitation_token).to be_nil
      expect(User.find_by_invitation_token(token, true)).to be_nil
    end

    it "is refused for a member who can't invite, and changes nothing" do
      invitation = invite_to("keep@example.com", is_org, pawel)
      sign_in(stefan)

      delete organization_invitation_path(is_org, invitation)

      expect(invitation.reload.revoked_at).to be_nil
    end

    it "can't reach another organization's invitation" do
      other = invite_to("other@example.com", hc_org, pawel)
      sign_in(pawel)

      delete organization_invitation_path(is_org, other)

      expect(response).to have_http_status(:not_found)
      expect(other.reload.revoked_at).to be_nil
    end

    it "can't reach an organization the user isn't in" do
      outsider = users(:maria)
      invitation = invite_to("x@example.com", is_org, pawel)
      sign_in(outsider)

      delete organization_invitation_path(is_org, invitation)

      expect(invitation.reload.revoked_at).to be_nil
    end
  end

  describe "POST /organizations/:organization_id/invitations/:id/resend" do
    it "mails the same address again and kills the earlier link" do
      first = invite_to("again@example.com", is_org, pawel)
      old_token = mail_token(ActionMailer::Base.deliveries.last)
      sign_in(pawel)

      post resend_organization_invitation_path(is_org, first)

      expect(response).to redirect_to(organization_path(is_org))
      expect(ActionMailer::Base.deliveries.last.to).to eq(["again@example.com"])
      expect(first.reload.revoked_at).to be_present
      expect(is_org.invitations.pending.where(email: "again@example.com").count).to eq(1)
      expect(User.find_by_invitation_token(old_token, true)).to be_nil
      expect(User.find_by_invitation_token(mail_token(ActionMailer::Base.deliveries.last), true)).to be_present
    end

    it "is refused for a member who can't invite, and sends nothing" do
      invitation = invite_to("quiet@example.com", is_org, pawel)
      ActionMailer::Base.deliveries.clear
      sign_in(stefan)

      post resend_organization_invitation_path(is_org, invitation)

      expect(ActionMailer::Base.deliveries).to be_empty
      expect(invitation.reload.revoked_at).to be_nil
    end
  end
end
