# spec/models/table_spec.rb
require 'rails_helper'

RSpec.describe SpacePolicy, type: :model do
  fixtures :organizations
  fixtures :users
  fixtures :organization_users
  fixtures :spaces
  fixtures :space_memberships
  fixtures :teams
  fixtures :team_memberships

  subject { described_class }

  let(:policy_user_context) { PolicyUserContext.new(organization_user.user, organization_user.organization) }
  let(:current_organization) { organization_user.organization }
  let(:policy) { SpacePolicy::Scope.new(policy_user_context, current_organization.spaces.all) }

  context "current organization is is" do
    context "manager" do
      let(:organization_user) { organization_users(:ou_is_pawel) }

      it "sees all spaces" do
        expect(policy.resolve.order(:name).map(&:name)).to eq(["Default IS", "Stefan's Private Space"])
      end
    end

    context "member" do
      context "stefan" do
        let(:organization_user) { organization_users(:ou_is_stefan) }

        it "sees only spaces that his member of" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Default IS", "Stefan's Private Space"])
        end
      end
    end
  end

  context "current organization is hc" do
    context "manager" do
      let(:organization_user) { organization_users(:ou_hc_pawel) }

      it "sees all spaces" do
        expect(policy.resolve.order(:name).map(&:name)).to eq(["Administrators Space", "Default HC", "Pawel's Private Space"])
      end
    end

    context "member" do
      context "maria" do
        let(:organization_user) { organization_users(:ou_hc_maria) }

        it "maria can see only public spaces" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Default HC"])
        end
      end

      context "stefan" do
        let(:organization_user) { organization_users(:ou_hc_stefan) }

        it "sees only spaces that his member of" do
          expect(policy.resolve.order(:name).map(&:name)).to eq(["Administrators Space", "Default HC"])
        end
      end
    end
  end
end