require "rails_helper"

RSpec.describe ImportSessionPolicy, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships

  let(:org) { organizations(:hc) }
  let(:owner) { organization_memberships(:om_hc_maria) }
  let(:manager) { organization_memberships(:om_hc_pawel) }
  let(:other_member) { organization_memberships(:om_hc_stefan) }

  # An import lists the paths, sizes and checksums of everything it uploaded, so it is as
  # private as the space it imports into. Anyone in the organization could read one, including
  # imports into private spaces they cannot open.
  let!(:session) do
    ImportSession.create!(organization: org, space: spaces(:hc_default), organization_membership: owner)
  end

  def context_for(membership)
    PolicyUserContext.new(membership.user, membership.organization)
  end

  def visible_to(membership)
    described_class::Scope.new(context_for(membership), org.import_sessions).resolve
  end

  describe "#show?" do
    it "allows the member who started the import" do
      expect(described_class.new(context_for(owner), session).show?).to be(true)
    end

    it "allows a manager" do
      expect(described_class.new(context_for(manager), session).show?).to be(true)
    end

    it "denies any other member" do
      expect(described_class.new(context_for(other_member), session).show?).to be(false)
    end
  end

  describe "Scope" do
    it "shows a member only their own imports" do
      expect(visible_to(owner)).to include(session)
      expect(visible_to(other_member)).not_to include(session)
    end

    it "shows a manager every import in the organization" do
      expect(visible_to(manager)).to include(session)
    end
  end
end
