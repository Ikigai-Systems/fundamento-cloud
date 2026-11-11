require "rails_helper"

RSpec.describe User, type: :model do
  fixtures :users, :organizations, :organization_memberships

  # Every path that asks "which organizations does this user belong to" -- the picker,
  # EnsureOrganization, the ActionCable connection check, UserPolicy, the MCP tools --
  # goes through this one association. Scoping it here is what keeps a trashed
  # organization out of all of them at once.
  describe "#organizations" do
    it "excludes trashed organizations" do
      user = users(:pawel)
      trashed = user.organizations.first
      expect(trashed).to be_present

      trashed.trash!(by: user)

      expect(user.organizations.reload).not_to include(trashed)
    end
  end

  describe "#sign_out_everywhere!" do
    let(:user) { users(:pawel) }

    it "audits that it happened without storing the token" do
      user.sign_out_everywhere!

      changes = user.audits.reorder(:id).last.audited_changes
      expect(changes.keys).to eq(["session_token"])
      expect(changes.to_json).not_to include(user.session_token)
    end
  end

  # Organization invitations run on devise_invitable with a few overrides in User (see the
  # comments there). These examples pin the behaviour those overrides depend on, so a gem
  # release that changes it fails here, not in production. Request specs cover the controller.
  describe "organization invitations" do
    let(:inviter) { users(:pawel) }
    let(:is_org) { organizations(:is) }
    let(:hc_org) { organizations(:hc) }

    def invite(email, organization)
      described_class.invite!({ email: email }, inviter, invitation_data: { organization_id: organization.id })
    end

    before { ActionMailer::Base.deliveries.clear }

    it "stores the organization and the inviter on the invitation, without creating a user" do
      expect { invite("new@example.com", is_org) }.not_to change(described_class, :count)

      invitation = DeviseInvitable::Invitation.pending.last
      expect(invitation.organization).to eq(is_org)
      expect(invitation.invited_by).to eq(inviter)
    end

    it "has the organization when the mail is built" do
      invite("new@example.com", is_org)

      expect(ActionMailer::Base.deliveries.last.subject).to include(is_org.name)
    end

    it "keeps invitations to different organizations independent" do
      first = invite("new@example.com", is_org)
      second = invite("new@example.com", hc_org)

      expect(DeviseInvitable::Invitation.pending.pluck(:organization_id)).to contain_exactly("is", "hc")
      expect(described_class.find_by_invitation_token(first.raw_invitation_token, true).organization).to eq(is_org)
      expect(described_class.find_by_invitation_token(second.raw_invitation_token, true).organization).to eq(hc_org)
    end

    it "invites an email that already has an account" do
      john = users(:john)

      invitation = invite(john.email, is_org)

      expect(invitation.errors).to be_empty
      expect(DeviseInvitable::Invitation.pending.pluck(:organization_id)).to eq(["is"])
      expect(ActionMailer::Base.deliveries.last.to).to eq([john.email])
    end

    context "when a registered user has a pending invitation to another organization" do
      let(:john) { users(:john) }

      before do
        john.update!(password: "a-long-password-1", password_confirmation: "a-long-password-1", confirmed_at: Time.current)
        invite(john.email, is_org)
      end

      it "doesn't change their password" do
        expect(john.reload.valid_password?("a-long-password-1")).to be true
      end

      it "doesn't block them from signing in" do
        expect(john.reload.active_for_authentication?).to be true
      end

      it "doesn't query invitations to decide whether they may sign in, which happens on every request" do
        user = john.reload
        queries = []
        callback = ->(*, payload) { queries << payload[:sql] }

        ActiveSupport::Notifications.subscribed(callback, "sql.active_record") { user.active_for_authentication? }

        expect(queries.grep(/devise_invitations/)).to be_empty
      end

      it "doesn't stop them from resetting their password" do
        ActionMailer::Base.deliveries.clear

        john.reload.send_reset_password_instructions

        expect(ActionMailer::Base.deliveries.last&.subject).to match(/password/i)
      end
    end

    it "doesn't find an invitation from a garbage token" do
      expect(described_class.find_by_invitation_token("garbage", true)).to be_nil
    end

    it "doesn't find an invitation past its validity period" do
      invitation = invite("new@example.com", is_org)

      travel_to(Devise.invite_for.from_now + 1.day) do
        expect(described_class.find_by_invitation_token(invitation.raw_invitation_token, true)).to be_nil
      end
    end

    it "removes an organization's invitations with it" do
      org = Organization.create!(name: "Doomed")
      invite("new@example.com", org)

      expect { org.destroy! }.to change { DeviseInvitable::Invitation.where(organization_id: org.id).count }.from(1).to(0)
    end
  end
end
