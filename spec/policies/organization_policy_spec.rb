require "rails_helper"

RSpec.describe OrganizationPolicy, type: :policy do
  fixtures :organizations, :users, :organization_users

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:maria) { users(:maria) }
  let(:john) { users(:john) }

  subject { described_class }

  permissions :create? do
    context "when user is authenticated" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }
      let(:new_organization) { Organization.new }

      it "permits creation" do
        expect(subject).to permit(policy_context, new_organization)
      end
    end

    context "when user is not in any organization" do
      let(:policy_context) { PolicyUserContext.new(john, nil) }
      let(:new_organization) { Organization.new }

      it "permits creation" do
        expect(subject).to permit(policy_context, new_organization)
      end
    end
  end

  permissions :show? do
    context "when user is a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits showing the organization" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    context "when user is a manager of the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits showing the organization" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies showing the organization" do
        # Maria (ou_hc_maria) is only a member of hc_org, not is_org
        expect(maria.organizations).not_to include(is_org)
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user has no organization membership at all" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }

      it "denies showing the organization" do
        expect(john.organizations).to be_empty
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user is member of different organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies showing organization they don't belong to" do
        # Maria is member of hc_org, trying to access is_org
        expect(maria.organizations).to include(hc_org)
        expect(maria.organizations).not_to include(is_org)
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  permissions :index? do
    it "has same permissions as show?" do
      policy_context = PolicyUserContext.new(pawel, is_org)

      show_permission = described_class.new(policy_context, is_org).show?
      index_permission = described_class.new(policy_context, is_org).index?

      expect(index_permission).to eq(show_permission)
    end

    context "when user is a member" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "permits indexing" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies indexing" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  permissions :select? do
    it "has same permissions as show?" do
      policy_context = PolicyUserContext.new(pawel, is_org)

      show_permission = described_class.new(policy_context, is_org).show?
      select_permission = described_class.new(policy_context, is_org).select?

      expect(select_permission).to eq(show_permission)
    end

    context "when user is a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "permits selecting the organization" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies selecting the organization" do
        # This is the critical test - ou_hc_maria should NOT be able to select is_org
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user has no organization membership" do
      let(:policy_context) { PolicyUserContext.new(john, is_org) }

      it "denies selecting the organization" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  permissions :update? do
    context "when user is a manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits updating the organization" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    context "when user is a member (not manager) in the organization" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies updating the organization" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies updating the organization" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user is manager of different organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies updating organization they don't manage" do
        # Maria is member (not manager) of hc_org, trying to update is_org
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  permissions :destroy? do
    it "has same permissions as update?" do
      policy_context = PolicyUserContext.new(pawel, is_org)

      update_permission = described_class.new(policy_context, is_org).update?
      destroy_permission = described_class.new(policy_context, is_org).destroy?

      expect(destroy_permission).to eq(update_permission)
    end

    context "when user is a manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits destroying the organization" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    context "when user is a member (not manager)" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies destroying the organization" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies destroying the organization" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  permissions :invite_user? do
    it "has same permissions as update?" do
      policy_context = PolicyUserContext.new(pawel, is_org)

      update_permission = described_class.new(policy_context, is_org).update?
      invite_permission = described_class.new(policy_context, is_org).invite_user?

      expect(invite_permission).to eq(update_permission)
    end

    context "when user is a manager in the organization" do
      let(:policy_context) { PolicyUserContext.new(pawel, is_org) }

      it "permits inviting users" do
        expect(subject).to permit(policy_context, is_org)
      end
    end

    context "when user is a member (not manager)" do
      let(:policy_context) { PolicyUserContext.new(stefan, is_org) }

      it "denies inviting users" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end

    xcontext "when user is NOT a member of the organization" do
      let(:policy_context) { PolicyUserContext.new(maria, is_org) }

      it "denies inviting users" do
        expect(subject).not_to permit(policy_context, is_org)
      end
    end
  end

  xdescribe "cross-organization access control" do
    it "prevents users from accessing organizations they don't belong to" do
      # Pawel is in both is_org and hc_org
      # Stefan is in both is_org and hc_org
      # Maria is ONLY in hc_org
      # John is in NO organizations

      # Maria should NOT be able to show/select is_org
      maria_context = PolicyUserContext.new(maria, is_org)
      expect(described_class.new(maria_context, is_org).show?).to be false
      expect(described_class.new(maria_context, is_org).select?).to be false
      expect(described_class.new(maria_context, is_org).update?).to be false

      # Maria SHOULD be able to show/select hc_org
      maria_hc_context = PolicyUserContext.new(maria, hc_org)
      expect(described_class.new(maria_hc_context, hc_org).show?).to be true
      expect(described_class.new(maria_hc_context, hc_org).select?).to be true

      # John should NOT be able to access ANY organization
      john_context = PolicyUserContext.new(john, is_org)
      expect(described_class.new(john_context, is_org).show?).to be false
      expect(described_class.new(john_context, is_org).select?).to be false
    end
  end
end
