# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe SpacePolicy, type: :model do
  fixtures :organizations
  fixtures :users
  fixtures :organization_memberships
  fixtures :spaces
  fixtures :space_memberships
  fixtures :teams
  fixtures :team_memberships

  subject { described_class }

  let(:policy_user_context) { PolicyUserContext.new(organization_membership.user, organization_membership.organization) }
  let(:current_organization) { organization_membership.organization }
  let(:policy) { SpacePolicy::Scope.new(policy_user_context, current_organization.spaces.all) }

  context "current organization is is" do
    context "manager" do
      let(:organization_membership) { organization_memberships(:om_is_pawel) }

      it "sees all spaces" do
        expect(policy.resolve.order(:name).map(&:name)).to eq(["Default IS", "Stefan's Private Space"])
      end
    end

    context "member" do
      context "stefan" do
        let(:organization_membership) { organization_memberships(:om_is_stefan) }

        it "sees only spaces that his member of" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Default IS", "Stefan's Private Space"])
        end
      end
    end
  end

  context "current organization is hc" do
    context "manager" do
      let(:organization_membership) { organization_memberships(:om_hc_pawel) }

      it "sees all spaces" do
        expect(policy.resolve.order(:name).map(&:name)).to eq(["Administrators Space", "Default HC", "Pawel's Private Space", "Restricted HC"])
      end
    end

    context "member" do
      context "maria" do
        let(:organization_membership) { organization_memberships(:om_hc_maria) }

        it "maria can see only public and restricted spaces" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Default HC", "Restricted HC"])
        end
      end

      context "stefan" do
        let(:organization_membership) { organization_memberships(:om_hc_stefan) }

        it "sees only spaces that his member of" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Administrators Space", "Default HC", "Restricted HC"])
        end
      end
    end
  end

  permissions :show? do
    it "grants access if space access mode is public" do
      expect(subject).to permit(PolicyUserContext.new(organization_memberships(:om_is_stefan)), spaces(:is_default))
    end

    it "denies access if user is not a member of the space" do
      expect(subject).not_to permit(PolicyUserContext.new(organization_memberships(:om_hc_maria)), spaces(:hc_administrators))
    end

    it "grants access if user is a member of the space" do
      expect(subject).to permit(PolicyUserContext.new(organization_memberships(:om_hc_stefan)), spaces(:hc_administrators))
    end
  end

  permissions :update? do
    it "grants access if space access mode is public" do
      expect(subject).to permit(PolicyUserContext.new(organization_memberships(:om_is_stefan)), spaces(:is_default))
    end

    it "grants access if user is a manager in the organization" do
      expect(subject).to permit(PolicyUserContext.new(organization_memberships(:om_is_pawel)), spaces(:is_stefans))
    end

    it "denies access if space access mode is restricted" do
      expect(subject).not_to permit(PolicyUserContext.new(organization_memberships(:om_hc_maria)), spaces(:hc_restricted))
    end

    it "denies access if user is not a member of the space" do
      expect(subject).not_to permit(PolicyUserContext.new(organization_memberships(:om_hc_maria)), spaces(:hc_administrators))
    end

    it "grants access if user is a member of the space" do
      expect(subject).to permit(PolicyUserContext.new(organization_memberships(:om_hc_stefan)), spaces(:hc_administrators))
    end
  end
end