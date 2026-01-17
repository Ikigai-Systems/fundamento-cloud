require "rails_helper"

RSpec.describe TeamMembership, type: :model do
  fixtures :organizations, :users, :organization_memberships, :teams, :team_memberships

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:john) { users(:john) }

  let(:om_is_pawel) { organization_memberships(:om_is_pawel) }
  let(:om_is_stefan) { organization_memberships(:om_is_stefan) }
  let(:om_hc_stefan) { organization_memberships(:om_hc_stefan) }
  let(:om_hc_maria) { organization_memberships(:om_hc_maria) }

  let(:hc_administrators_team) { teams(:hc_administrators) }

  describe "associations" do
    it "belongs to organization" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.organization).to eq(hc_org)
      expect(membership.organization).to be_a(Organization)
    end

    it "belongs to team" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.team).to be_a(Team)
      expect(membership.team).to eq(hc_administrators_team)
    end

    it "belongs to member polymorphically" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.member).to be_a(OrganizationMembership)
      expect(membership.member).to eq(om_hc_stefan)
    end
  end

  describe "polymorphic member_type validation" do
    it "accepts OrganizationMembership as member_type" do
      membership = TeamMembership.new(
        organization: hc_org,
        team: hc_administrators_team,
        member: om_hc_stefan
      )

      expect(membership).to be_valid
      expect(membership.member_type).to eq("OrganizationMembership")
    end

    it "rejects Team as member_type (teams cannot be members of teams)" do
      membership = TeamMembership.new(
        organization: hc_org,
        team: hc_administrators_team,
        member_type: "Team",
        member_id: hc_administrators_team.id
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:member_type]).to be_present
    end

    it "rejects other invalid member_type" do
      membership = TeamMembership.new(
        organization: hc_org,
        team: hc_administrators_team,
        member_type: "User",
        member_id: "some_id"
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:member_type]).to be_present
    end

    it "only validates OrganizationMembership in inclusion" do
      team_membership_validators_on = TeamMembership.validators_on(:member_type)

      expect(team_membership_validators_on.map(&:class)).to include(ActiveModel::Validations::InclusionValidator)

      validator = team_membership_validators_on.find { |v| v.is_a?(ActiveModel::Validations::InclusionValidator) }

      expect(validator&.options[:in]).to eq(%w(OrganizationMembership))
    end
  end

  describe "creating team_membership with OrganizationMembership" do
    it "creates membership successfully" do
      membership = TeamMembership.create!(
        organization: hc_org,
        team: hc_administrators_team,
        member: om_is_pawel
      )

      expect(membership.member_id).to eq(om_is_pawel.id)
      expect(membership.member_type).to eq("OrganizationMembership")
      expect(membership.member_id).to be_a(String) # NPI
    end

    it "sets composite primary key correctly" do
      membership = TeamMembership.create!(
        organization: hc_org,
        team: hc_administrators_team,
        member: om_is_pawel
      )

      found = TeamMembership.find_by(
        team_id: hc_administrators_team.id,
        member_id: om_is_pawel.id,
        member_type: "OrganizationMembership"
      )

      expect(found).to eq(membership)
    end

    it "stores NPI string as member_id" do
      membership = TeamMembership.create!(
        organization: hc_org,
        team: hc_administrators_team,
        member: om_hc_maria
      )

      expect(membership.member_id).to eq(om_hc_maria.id)
      expect(membership.member_id).to eq("om_hc_maria")
      expect(membership.member_id).to be_a(String)
    end
  end

  describe "querying team_memberships by OrganizationMembership" do
    it "finds memberships where member is OrganizationMembership" do
      ou_memberships = TeamMembership.where(member_type: "OrganizationMembership")

      expect(ou_memberships.count).to be > 0
      expect(ou_memberships.first.member).to be_a(OrganizationMembership)
    end

    it "finds specific membership by organization_membership" do
      membership = TeamMembership.find_by(
        member: om_hc_stefan
      )

      expect(membership).to be_present
      expect(membership.member).to eq(om_hc_stefan)
      expect(membership.team).to eq(hc_administrators_team)
    end

    it "can query through team association" do
      memberships = hc_administrators_team.team_memberships.where(member_type: "OrganizationMembership")

      expect(memberships).to be_present
      ou_membership = memberships.first
      expect(ou_membership.member).to be_a(OrganizationMembership)
    end
  end

  describe "#display_name" do
    context "when member is OrganizationMembership" do
      it "returns display_name from organization_membership" do
        membership = team_memberships(:hc_administrators_membership_1)

        expect(membership.display_name).to eq(om_hc_stefan.display_name)
      end

      it "delegates to user's display_name" do
        membership = team_memberships(:hc_administrators_membership_1)
        expected_name = om_hc_stefan.user.display_name

        expect(membership.display_name).to eq(expected_name)
      end
    end
  end

  describe "composite primary key" do
    it "uses team_id, member_id, and member_type as primary key" do
      expect(TeamMembership.primary_key).to eq(%w[team_id member_id member_type])
    end

    it "can find record using composite key" do
      membership = team_memberships(:hc_administrators_membership_1)

      found = TeamMembership.find([
        membership.team_id,
        membership.member_id,
        membership.member_type
      ])

      expect(found).to eq(membership)
    end

    it "prevents duplicate memberships" do
      existing = team_memberships(:hc_administrators_membership_1)

      duplicate = TeamMembership.new(
        organization: existing.organization,
        team: existing.team,
        member: existing.member
      )

      expect { duplicate.save! }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "cascading deletes" do
    it "is destroyed when team is destroyed" do
      new_team = Team.create!(
        organization: hc_org,
        shortcut: "@test",
        name: "Test Team"
      )

      membership = TeamMembership.create!(
        organization: hc_org,
        team: new_team,
        member: om_hc_stefan
      )

      expect {
        new_team.destroy
      }.to change(TeamMembership, :count).by(-1)
    end

    it "is destroyed when organization_membership is destroyed" do
      new_team = Team.create!(
        organization: is_org,
        shortcut: "@test",
        name: "Another Test Team"
      )

      new_ou = OrganizationMembership.create!(
        organization: is_org,
        user: john,
        role: :member
      )

      membership = TeamMembership.create!(
        organization: is_org,
        team: new_team,
        member: new_ou
      )

      expect {
        new_ou.destroy
      }.to change { TeamMembership.exists?(team: new_team, member_id: new_ou.id, member_type: "OrganizationMembership") }.from(true).to(false)
    end
  end

  describe "role enum" do
    it "does not have role enum (commented out in model)" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership).not_to respond_to(:role)
      expect(membership).not_to respond_to(:manager?)
    end

    it "does not have role column in table" do
      expect(TeamMembership.column_names).not_to include("role")
    end
  end

  describe "with fixtures" do
    it "loads OrganizationMembership memberships from fixtures" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.member_type).to eq("OrganizationMembership")
      expect(membership.member).to be_a(OrganizationMembership)
      expect(membership.member.id).to eq("om_hc_stefan")
    end

    it "has correct organization reference in fixtures" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.organization_id).to eq("hc")
      expect(membership.organization).to eq(hc_org)
    end

    it "has correct team reference in fixtures" do
      membership = team_memberships(:hc_administrators_membership_1)

      expect(membership.team).to eq(hc_administrators_team)
    end
  end

  describe "querying through associations" do
    it "can find all OrganizationMembership members of a team" do
      ou_members = hc_administrators_team.team_memberships.where(member_type: "OrganizationMembership").map(&:member)

      expect(ou_members).to all(be_a(OrganizationMembership))
      expect(ou_members).to include(om_hc_stefan)
    end

    it "can find all teams an OrganizationMembership is a member of" do
      memberships = TeamMembership.where(member: om_hc_stefan)
      teams = memberships.map(&:team)

      expect(teams).to all(be_a(Team))
      expect(teams).to include(hc_administrators_team)
    end
  end

  describe "difference from SpaceMembership" do
    it "TeamMembership only accepts OrganizationMembership, not Team" do
      # SpaceMembership accepts both OrganizationMembership and Team
      # TeamMembership only accepts OrganizationMembership

      team_membership = TeamMembership.new(
        organization: hc_org,
        team: hc_administrators_team,
        member_type: "Team",
        member_id: "some_team_id"
      )

      expect(team_membership).not_to be_valid
    end

    it "TeamMembership has no role enum" do
      expect(TeamMembership.new).not_to respond_to(:role)
    end
  end
end
