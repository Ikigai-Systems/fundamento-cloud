require "rails_helper"

RSpec.describe OrganizationUserPolicy, type: :policy do
  fixtures :organizations, :users, :organization_memberships

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:maria) { users(:maria) }
  let(:john) { users(:john) }

  let(:om_is_pawel) { organization_memberships(:om_is_pawel) } # manager in is_org
  let(:om_is_stefan) { organization_memberships(:om_is_stefan) } # member in is_org
  let(:om_hc_maria) { organization_memberships(:om_hc_maria) } # member in hc_org

  subject { described_class }

  permissions :create? do
    context "when user is manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }
      let(:target_org_user) { OrganizationUser.new(organization: is_org) }

      when_feature_enabled(:standalone) do
        it "permits creation" do
          expect(subject).to permit(policy_context, target_org_user)
        end
      end

      when_feature_disabled(:standalone) do
        it "denies creation" do
          expect(subject).not_to permit(policy_context, target_org_user)
        end
      end
    end

    context "when user is member in the organization" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }
      let(:target_org_user) { OrganizationUser.new(organization: is_org) }

      when_feature_both_states(:standalone) do
        it "denies creation" do
          expect(subject).not_to permit(policy_context, target_org_user)
        end
      end
    end

    context "when user is not in the organization" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }
      let(:target_org_user) { OrganizationUser.new(organization: is_org) }

      when_feature_both_states(:standalone) do
        it "denies creation" do
          expect(subject).not_to permit(policy_context, target_org_user)
        end
      end
    end
  end

  permissions :change_password? do
    context "when standalone is disabled" do
      before do
        with_feature_flag(:standalone, enabled: false)
      end

      it "has same permissions as #create?" do
        policy_context = PolicyUserContext.new(pawel, is_org)
        target_org_user = OrganizationUser.new(organization: is_org)

        create_permission = described_class.new(policy_context, target_org_user).create?
        change_password_permission = described_class.new(policy_context, target_org_user).change_password?

        expect(change_password_permission).to eq(create_permission)
      end
    end

    context "when user is manager and :standalone is enabled" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }
      let(:target_org_user) { om_is_stefan }

      before do
        with_feature_flag(:standalone, enabled: true)
      end

      it "permits password change" do
        expect(subject).to permit(policy_context, target_org_user)
      end
    end

    context "when user is member" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }
      let(:target_org_user) { om_is_stefan }

      it "denies password change" do
        expect(subject).not_to permit(policy_context, target_org_user)
      end
    end
  end

  permissions :destroy? do
    context "when user is manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits removing another member" do
        expect(subject).to permit(policy_context, om_is_stefan)
      end

      it "permits removing another manager" do
        another_manager = OrganizationUser.create!(
          organization: is_org,
          user: john,
          role: :manager
        )

        expect(subject).to permit(policy_context, another_manager)
      end

      it "permits removing themselves (controller prevents this, not policy)" do
        # Note: The controller has its own check to prevent self-removal
        expect(subject).to permit(policy_context, om_is_pawel)
      end
    end

    context "when user is member in the organization" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies removing anyone" do
        expect(subject).not_to permit(policy_context, om_is_pawel)
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end

    context "when user is not in the organization" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }

      it "denies removal" do
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end

    context "when user is manager in different organization" do
      let(:policy_context) { PolicyUserContext.new(maria, hc_org) }

      it "denies removal from another organization" do
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end
  end

  permissions :promote? do
    context "when user is manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      context "when target is a member" do
        it "permits promotion" do
          expect(subject).to permit(policy_context, om_is_stefan)
        end
      end

      context "when target is already a manager" do
        it "denies promotion" do
          expect(subject).not_to permit(policy_context, om_is_pawel)
        end
      end
    end

    context "when user is member in the organization" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies promotion" do
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end

    context "when user is not in the organization" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }

      it "denies promotion" do
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end
  end

  permissions :demote? do
    before do
      # Make stefan a manager for testing demotion
      om_is_stefan.update!(role: :manager)
    end

    after do
      # Reset for other tests
      om_is_stefan.update!(role: :member)
    end

    context "when user is manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      context "when target is a manager" do
        it "permits demotion" do
          expect(subject).to permit(policy_context, om_is_stefan)
        end
      end

      context "when target is already a member" do
        before { om_is_stefan.update!(role: :member) }

        it "denies demotion" do
          expect(subject).not_to permit(policy_context, om_is_stefan)
        end
      end

      context "when trying to demote themselves" do
        it "permits demotion (controller prevents this, not policy)" do
          # Note: The controller has its own check to prevent self-demotion
          expect(subject).to permit(policy_context, om_is_pawel)
        end
      end
    end

    context "when user is member in the organization" do
      before { om_is_stefan.update!(role: :member) }

      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies demotion" do
        om_is_pawel_manager = om_is_pawel
        expect(subject).not_to permit(policy_context, om_is_pawel_manager)
      end
    end

    context "when user is not in the organization" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }

      it "denies demotion" do
        expect(subject).not_to permit(policy_context, om_is_stefan)
      end
    end
  end

  permissions :create?, :promote?, :demote?, :change_password?, :destroy? do
    it "uses organization from record, not from policy context" do
      # Create org_user in hc_org
      ou_hc_john = OrganizationUser.create!(
        organization: hc_org,
        user: john,
        role: :member
      )

      # Pawel is manager in is_org, but target is in hc_org
      policy_context = PolicyUserContext.new(pawel, is_org)

      # Should deny because pawel is not manager in hc_org
      expect(subject).not_to permit(policy_context, ou_hc_john)
    end

    context "when user has no membership in organization" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }
      let(:target_org_user) { om_is_stefan }

      it "denies all actions" do
        expect(subject).not_to permit(policy_context, target_org_user)
      end
    end
  end
end
