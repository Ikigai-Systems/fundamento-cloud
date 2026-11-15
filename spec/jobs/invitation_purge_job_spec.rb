require "rails_helper"

RSpec.describe InvitationPurgeJob, type: :job do
  fixtures :organizations, :users

  def invitation(**attributes)
    DeviseInvitable::Invitation.create!(
      {
        invitable_type: "User",
        invite_key: { "email" => "a@example.com" },
        organization_id: "is",
        invitation_token: SecureRandom.hex,
        invitation_created_at: Time.current,
        invitation_sent_at: Time.current
      }.merge(attributes)
    )
  end

  it "keeps a pending invitation that can still be accepted" do
    live = invitation

    expect { described_class.perform_now }.not_to change { DeviseInvitable::Invitation.exists?(live.id) }.from(true)
  end

  it "keeps an expired invitation until its retention has passed too" do
    sent = (Devise.invite_for + 1.day).ago
    expired = invitation(invitation_sent_at: sent)

    described_class.perform_now

    expect(DeviseInvitable::Invitation.exists?(expired.id)).to be true
  end

  it "removes a pending invitation that expired longer ago than the retention" do
    stale = invitation(invitation_sent_at: (Devise.invite_for + described_class::DEAD_RETENTION + 1.day).ago)

    described_class.perform_now

    expect(DeviseInvitable::Invitation.exists?(stale.id)).to be false
  end

  it "removes revoked and superseded invitations once their retention has passed, not before" do
    old = (described_class::DEAD_RETENTION + 1.day).ago
    revoked = invitation(revoked_at: old, invitation_token: nil)
    superseded = invitation(superseded_at: old, invitation_token: nil)
    recently_revoked = invitation(revoked_at: 1.day.ago, invitation_token: nil)

    described_class.perform_now

    expect(DeviseInvitable::Invitation.where(id: [revoked.id, superseded.id])).to be_empty
    expect(DeviseInvitable::Invitation.exists?(recently_revoked.id)).to be true
  end

  it "keeps accepted invitations for their own, longer retention" do
    recent = invitation(invitation_accepted_at: (described_class::ACCEPTED_RETENTION - 1.day).ago, invitation_token: nil)
    old = invitation(invitation_accepted_at: (described_class::ACCEPTED_RETENTION + 1.day).ago, invitation_token: nil)

    described_class.perform_now

    expect(DeviseInvitable::Invitation.exists?(recent.id)).to be true
    expect(DeviseInvitable::Invitation.exists?(old.id)).to be false
  end
end
