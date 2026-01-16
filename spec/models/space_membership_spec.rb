require "rails_helper"

RSpec.describe SpaceMembership, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :teams

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:is_default_space) { spaces(:is_default) }
  let(:hc_secret_space) { spaces(:hc_secret) }
  let(:hc_administrators_space) { spaces(:hc_administrators) }

  let(:om_is_pawel) { organization_memberships(:om_is_pawel) }
  let(:om_is_stefan) { organization_memberships(:om_is_stefan) }
  let(:om_hc_pawel) { organization_memberships(:om_hc_pawel) }

  let(:hc_administrators_team) { teams(:hc_administrators) }

  describe "associations" do
    it "belongs to organization" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.organization).to eq(is_org)
      expect(membership.organization).to be_a(Organization)
    end

    it "belongs to space" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.space).to be_a(Space)
      expect(membership.space.organization).to eq(is_org)
    end

    it "belongs to member polymorphically" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.member).to be_a(OrganizationUser)
      expect(membership.member).to eq(om_is_stefan)
    end
  end

  describe "polymorphic member_type validation" do
    it "accepts OrganizationUser as member_type" do
      membership = SpaceMembership.new(
        organization: is_org,
        space: is_default_space,
        member: om_is_pawel,
        role: :manager
      )

      expect(membership).to be_valid
      expect(membership.member_type).to eq("OrganizationUser")
    end

    it "accepts Team as member_type" do
      membership = SpaceMembership.new(
        organization: hc_org,
        space: hc_administrators_space,
        member: hc_administrators_team,
        role: :manager
      )

      expect(membership).to be_valid
      expect(membership.member_type).to eq("Team")
    end

    it "rejects invalid member_type" do
      membership = SpaceMembership.new(
        organization: is_org,
        space: is_default_space,
        member_type: "User",
        member_id: "some_id",
        role: :manager
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:member_type]).to be_present
    end
  end

  describe "creating space_membership with OrganizationUser" do
    it "creates membership successfully" do
      membership = SpaceMembership.create!(
        organization: is_org,
        space: is_default_space,
        member: om_is_pawel,
        role: :manager
      )

      expect(membership.member_id).to eq(om_is_pawel.id)
      expect(membership.member_type).to eq("OrganizationUser")
      expect(membership.member_id).to be_a(String) # NPI
    end

    it "sets composite primary key correctly" do
      membership = SpaceMembership.create!(
        organization: is_org,
        space: is_default_space,
        member: om_is_pawel,
        role: :manager
      )

      found = SpaceMembership.find_by(
        space_id: is_default_space.id,
        member_id: om_is_pawel.id,
        member_type: "OrganizationUser"
      )

      expect(found).to eq(membership)
    end
  end

  describe "querying space_memberships by OrganizationUser" do
    it "finds memberships where member is OrganizationUser" do
      ou_memberships = SpaceMembership.where(member_type: "OrganizationUser")

      expect(ou_memberships.count).to be > 0
      expect(ou_memberships.first.member).to be_a(OrganizationUser)
    end

    it "finds specific membership by organization_user" do
      membership = SpaceMembership.find_by(
        member: om_is_stefan
      )

      expect(membership).to be_present
      expect(membership.member).to eq(om_is_stefan)
    end

    it "can query through space association" do
      space = spaces(:is_stefans)
      memberships = space.space_memberships.where(member_type: "OrganizationUser")

      expect(memberships).to be_present
      ou_membership = memberships.first
      expect(ou_membership.member).to be_a(OrganizationUser)
    end
  end

  describe "#display_name" do
    context "when member is OrganizationUser" do
      it "returns display_name from organization_user" do
        membership = space_memberships(:is_stefans_membership_1)

        expect(membership.display_name).to eq(om_is_stefan.display_name)
      end

      it "delegates to user's display_name" do
        membership = space_memberships(:is_stefans_membership_1)
        expected_name = om_is_stefan.user.display_name

        expect(membership.display_name).to eq(expected_name)
      end
    end

    context "when member is Team" do
      it "returns name from team" do
        membership = space_memberships(:hc_administrators_membership_1)

        expect(membership.display_name).to eq(hc_administrators_team.name)
      end
    end
  end

  describe "composite primary key" do
    it "uses space_id, member_id, and member_type as primary key" do
      expect(SpaceMembership.primary_key).to eq(%w[space_id member_id member_type])
    end

    it "can find record using composite key" do
      membership = space_memberships(:is_stefans_membership_1)

      found = SpaceMembership.find([
        membership.space_id,
        membership.member_id,
        membership.member_type
      ])

      expect(found).to eq(membership)
    end

    it "prevents duplicate memberships" do
      existing = space_memberships(:is_stefans_membership_1)

      duplicate = SpaceMembership.new(
        organization: existing.organization,
        space: existing.space,
        member: existing.member,
        role: :manager
      )

      expect { duplicate.save! }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "cascading deletes" do
    it "is destroyed when space is destroyed" do
      space = Space.create!(
        organization: is_org,
        name: "Test Space"
      )

      membership = SpaceMembership.create!(
        organization: is_org,
        space: space,
        member: om_is_pawel,
        role: :manager
      )

      expect {
        space.destroy
      }.to change(SpaceMembership, :count).by(-1)
    end

    it "is destroyed when organization_user is destroyed" do
      new_space = Space.create!(
        organization: is_org,
        name: "Another Test Space"
      )

      new_ou = OrganizationUser.create!(
        organization: is_org,
        user: users(:john),
        role: :member
      )

      membership = SpaceMembership.create!(
        organization: is_org,
        space: new_space,
        member: new_ou,
        role: :manager
      )

      expect {
        new_ou.destroy
      }.to change { SpaceMembership.exists?(space: new_space, member_id: new_ou.id, member_type: "OrganizationUser") }.from(true).to(false)
    end
  end

  describe "role enum" do
    it "has :manager role" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.role).to eq("manager")
      expect(membership.manager?).to be true
    end

    it "can create membership with manager role" do
      membership = SpaceMembership.create!(
        organization: is_org,
        space: is_default_space,
        member: om_is_pawel,
        role: :manager
      )

      expect(membership.manager?).to be true
    end

    it "does not have other role types" do
      membership = SpaceMembership.new(
        organization: is_org,
        space: is_default_space,
        member: om_is_pawel
      )

      expect { membership.role = :member }.to raise_error(ArgumentError)
    end
  end

  describe "with fixtures" do
    it "loads OrganizationUser memberships from fixtures" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.member_type).to eq("OrganizationUser")
      expect(membership.member).to be_a(OrganizationUser)
      expect(membership.member.id).to eq("om_is_stefan")
    end

    it "loads Team memberships from fixtures" do
      membership = space_memberships(:hc_administrators_membership_1)

      expect(membership.member_type).to eq("Team")
      expect(membership.member).to be_a(Team)
    end

    it "has correct organization reference in fixtures" do
      membership = space_memberships(:is_stefans_membership_1)

      expect(membership.organization_id).to eq("is")
      expect(membership.organization).to eq(is_org)
    end
  end

  describe "querying through associations" do
    it "can find all OrganizationUser members of a space" do
      space = spaces(:hc_pawels)
      ou_members = space.space_memberships.where(member_type: "OrganizationUser").map(&:member)

      expect(ou_members).to all(be_a(OrganizationUser))
      expect(ou_members).to include(om_hc_pawel)
    end

    it "can find all spaces an OrganizationUser is a member of" do
      memberships = SpaceMembership.where(member: om_is_stefan)
      spaces = memberships.map(&:space)

      expect(spaces).to all(be_a(Space))
      expect(spaces.map(&:organization).uniq).to eq([is_org])
    end
  end
end
