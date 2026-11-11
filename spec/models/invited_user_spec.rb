require "rails_helper"

RSpec.describe InvitedUser, type: :model do
  fixtures :organizations, :users, :organization_memberships

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }

  describe ".invite!" do
    it "creates a pending invitation tied to the organization and the inviter" do
      invitation = described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel)

      expect(invitation).to be_persisted
      expect(invitation.organization).to eq(is_org)
      expect(invitation.invited_by).to eq(pawel)
      expect(invitation.raw_invitation_token).to be_present
    end

    it "allows the same email to be invited to different organizations" do
      described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel)

      expect {
        described_class.invite!({ email: "new@example.com", organization_id: hc_org.id }, pawel)
      }.to change(described_class, :count).by(1)
    end

    it "reuses the row for the same email and organization, and issues a new token" do
      first = described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel)
      first_token = first.raw_invitation_token

      second = nil
      expect {
        second = described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel)
      }.not_to change(described_class, :count)

      expect(second.id).to eq(first.id)
      expect(second.raw_invitation_token).not_to eq(first_token)
    end

    it "matches the email regardless of case" do
      described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel)

      expect {
        described_class.invite!({ email: "NEW@example.com", organization_id: is_org.id }, pawel)
      }.not_to change(described_class, :count)
    end

    it "rejects a malformed email" do
      invitation = described_class.invite!({ email: "nope", organization_id: is_org.id }, pawel)

      expect(invitation).not_to be_persisted
      expect(invitation.errors[:email]).to be_present
    end
  end

  describe "validity" do
    let!(:invitation) { described_class.invite!({ email: "new@example.com", organization_id: is_org.id }, pawel) }

    it "is valid for two weeks from sending" do
      expect(invitation.invitation_due_at).to be_within(1.minute).of(2.weeks.from_now)
      expect(invitation.valid_invitation?).to be true

      travel_to(15.days.from_now) { expect(invitation.valid_invitation?).to be false }
    end
  end

  describe "organization deletion" do
    it "removes the organization's pending invitations and leaves other organizations' alone" do
      doomed = Organization.create!(name: "Doomed")
      described_class.invite!({ email: "a@example.com", organization_id: doomed.id }, pawel)
      kept = described_class.invite!({ email: "a@example.com", organization_id: is_org.id }, pawel)

      expect { doomed.destroy! }.to change(described_class, :count).by(-1)
      expect(described_class.find(kept.id)).to be_present
    end
  end
end
