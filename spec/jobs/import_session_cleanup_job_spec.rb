require "rails_helper"

RSpec.describe ImportSessionCleanupJob, type: :job do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  it "destroys expired pending sessions" do
    expired = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      expires_at: 1.day.ago
    )
    active = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      expires_at: 1.day.from_now
    )

    described_class.perform_now

    expect(ImportSession.find_by(id: expired.id)).to be_nil
    expect(ImportSession.find_by(id: active.id)).to be_present
  end

  it "does not destroy completed sessions even if past expires_at" do
    completed = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :completed,
      expires_at: 1.day.ago
    )

    described_class.perform_now

    expect(ImportSession.find_by(id: completed.id)).to be_present
  end
end
