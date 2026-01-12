require "rails_helper"

RSpec.describe PolicyUserContext, type: :model do
  fixtures :organizations, :users, :organization_users

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:john) { users(:john) } # Not in any organization

  let(:ou_is_pawel) { organization_users(:ou_is_pawel) }
  let(:ou_is_stefan) { organization_users(:ou_is_stefan) }
  let(:ou_hc_pawel) { organization_users(:ou_hc_pawel) }

  describe "#initialize with OrganizationUser" do
    subject { described_class.new(ou_is_pawel) }

    it "sets @user to organization_user's user" do
      expect(subject.user).to eq(pawel)
    end

    it "sets @current_organization to organization_user's organization" do
      expect(subject.current_organization).to eq(is_org)
    end

    it "sets @organization_user to the passed organization_user" do
      expect(subject.organization_user).to eq(ou_is_pawel)
    end

    it "exposes user via attr_reader" do
      expect(subject).to respond_to(:user)
      expect(subject.user).to be_a(User)
    end

    it "exposes current_organization via attr_reader" do
      expect(subject).to respond_to(:current_organization)
      expect(subject.current_organization).to be_a(Organization)
    end

    it "exposes organization_user via attr_reader" do
      expect(subject).to respond_to(:organization_user)
      expect(subject.organization_user).to be_a(OrganizationUser)
    end
  end

  describe "#initialize with User and Organization" do
    subject { described_class.new(pawel, is_org) }

    it "sets @user to the passed user" do
      expect(subject.user).to eq(pawel)
    end

    it "sets @current_organization to the passed organization" do
      expect(subject.current_organization).to eq(is_org)
    end

    it "looks up @organization_user by user and organization" do
      expect(subject.organization_user).to eq(ou_is_pawel)
      expect(subject.organization_user).to be_a(OrganizationUser)
    end

    context "when user belongs to organization" do
      it "finds the correct organization_user" do
        context = described_class.new(stefan, is_org)

        expect(context.organization_user).to eq(ou_is_stefan)
      end

      it "finds organization_user with correct role" do
        context = described_class.new(pawel, is_org)

        expect(context.organization_user.role).to eq("manager")
      end
    end

    context "when user belongs to multiple organizations" do
      it "finds organization_user for the specified organization" do
        # Pawel is in both is_org and hc_org
        context_is = described_class.new(pawel, is_org)
        context_hc = described_class.new(pawel, hc_org)

        expect(context_is.organization_user).to eq(ou_is_pawel)
        expect(context_is.organization_user.organization).to eq(is_org)

        expect(context_hc.organization_user).to eq(ou_hc_pawel)
        expect(context_hc.organization_user.organization).to eq(hc_org)
      end
    end

    context "when user does not belong to organization" do
      subject { described_class.new(john, is_org) }

      it "sets @organization_user to nil" do
        expect(subject.organization_user).to be_nil
      end

      it "still sets user and current_organization" do
        expect(subject.user).to eq(john)
        expect(subject.current_organization).to eq(is_org)
      end
    end

    context "when organization is nil" do
      subject { described_class.new(pawel, nil) }

      it "sets @organization_user to nil" do
        expect(subject.organization_user).to be_nil
      end

      it "sets @current_organization to nil" do
        expect(subject.current_organization).to be_nil
      end

      it "still sets user" do
        expect(subject.user).to eq(pawel)
      end
    end
  end

  describe "type detection" do
    it "detects OrganizationUser input correctly" do
      context = described_class.new(ou_is_pawel)

      expect(context.organization_user).to eq(ou_is_pawel)
      expect(context.user).to eq(pawel)
      expect(context.current_organization).to eq(is_org)
    end

    it "detects User input correctly" do
      context = described_class.new(pawel, is_org)

      expect(context.user).to eq(pawel)
      expect(context.current_organization).to eq(is_org)
      expect(context.organization_user).to eq(ou_is_pawel)
    end

    it "differentiates between OrganizationUser and User" do
      ou_context = described_class.new(ou_is_pawel)
      user_context = described_class.new(pawel, is_org)

      # Both should result in same values but via different code paths
      expect(ou_context.user).to eq(user_context.user)
      expect(ou_context.current_organization).to eq(user_context.current_organization)
      expect(ou_context.organization_user).to eq(user_context.organization_user)
    end
  end

  describe "use in Pundit policies" do
    it "can be used as Pundit user context" do
      context = described_class.new(pawel, is_org)
      space = is_org.spaces.first

      policy = SpacePolicy.new(context, space)

      expect(policy.user).to eq(pawel)
      expect(policy.record).to eq(space)
    end

    it "provides organization_user for policy checks" do
      context = described_class.new(pawel, is_org)

      expect(context.organization_user).to be_present
      expect(context.organization_user.manager?).to be true
    end

    it "allows policy to check user role" do
      manager_context = described_class.new(pawel, is_org)
      member_context = described_class.new(stefan, is_org)

      expect(manager_context.organization_user.manager?).to be true
      expect(member_context.organization_user.member?).to be true
    end
  end

  describe "edge cases" do
    it "handles user with no organization memberships" do
      context = described_class.new(john, is_org)

      expect(context.user).to eq(john)
      expect(context.current_organization).to eq(is_org)
      expect(context.organization_user).to be_nil
    end

    it "handles organization with no users" do
      empty_org = Organization.create!(name: "Empty Org")
      context = described_class.new(pawel, empty_org)

      expect(context.user).to eq(pawel)
      expect(context.current_organization).to eq(empty_org)
      expect(context.organization_user).to be_nil
    end

    it "returns consistent results when called multiple times" do
      context1 = described_class.new(pawel, is_org)
      context2 = described_class.new(pawel, is_org)

      expect(context1.organization_user).to eq(context2.organization_user)
    end
  end

  describe "immutability" do
    subject { described_class.new(pawel, is_org) }

    it "exposes attributes as read-only" do
      expect(subject).not_to respond_to(:user=)
      expect(subject).not_to respond_to(:current_organization=)
      expect(subject).not_to respond_to(:organization_user=)
    end
  end
end
