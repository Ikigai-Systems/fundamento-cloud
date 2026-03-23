require "rails_helper"

RSpec.describe ObjectCommentPolicy, type: :policy do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments

  let(:comment) { object_comments(:one) }

  describe "#update?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.update?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.update?).to be false
    end
  end

  describe "#destroy?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.destroy?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.destroy?).to be false
    end
  end

  describe "#restore?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.restore?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.restore?).to be false
    end
  end
end
