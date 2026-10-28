require "rails_helper"

RSpec.describe OrganizationMembership, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_references

  describe "dependent associations" do
    let(:organization) { organizations(:is) }
    let(:space) { spaces(:is_default) }
    let(:user) { users(:john) }

    let!(:organization_membership) do
      OrganizationMembership.create!(
        organization: organization,
        user: user,
        role: :member
      )
    end

    describe "has_many :api_tokens, dependent: :delete_all" do
      it "deletes all api_tokens when organization_membership is destroyed" do
        token1 = organization_membership.api_tokens.create!(
          title: "Token 1",
          organization: organization
        )
        token2 = organization_membership.api_tokens.create!(
          title: "Token 2",
          organization: organization
        )

        expect {
          organization_membership.destroy
        }.to change(ApiToken, :count).by(-2)

        expect(ApiToken.exists?(token1.id)).to be false
        expect(ApiToken.exists?(token2.id)).to be false
      end
    end

    describe "has_many :favorites, dependent: :delete_all" do
      it "deletes all favorites when organization_membership is destroyed" do
        document1 = organization.documents.create!(space: space)
        document2 = organization.documents.create!(space: space)

        favorite1 = organization_membership.favorites.create!(object: document1)
        favorite2 = organization_membership.favorites.create!(object: document2)

        expect {
          organization_membership.destroy
        }.to change(Favorite, :count).by(-2)

        expect(Favorite.exists?(favorite1.id)).to be false
        expect(Favorite.exists?(favorite2.id)).to be false
      end
    end

    describe "has_many :reactions (ObjectReaction), dependent: :delete_all" do
      it "deletes all reactions when organization_membership is destroyed" do
        document = organization.documents.create!(space: space)

        reaction1 = organization_membership.reactions.create!(
          organization: organization,
          object: document,
          emoji: "👍"
        )
        reaction2 = organization_membership.reactions.create!(
          organization: organization,
          object: document,
          emoji: "❤️"
        )

        expect {
          organization_membership.destroy
        }.to change(ObjectReaction, :count).by(-2)

        expect(ObjectReaction.exists?(reaction1.id)).to be false
        expect(ObjectReaction.exists?(reaction2.id)).to be false
      end
    end

    describe "has_many :organization_membership_properties, dependent: :delete_all" do
      it "deletes all properties when organization_membership is destroyed" do
        prop1 = organization_membership.organization_membership_properties.create!(
          key: "last_seen",
          value: "2024-01-01"
        )
        prop2 = organization_membership.organization_membership_properties.create!(
          key: "theme",
          value: "dark"
        )

        expect {
          organization_membership.destroy
        }.to change(OrganizationMembershipProperty, :count).by(-2)

        expect(OrganizationMembershipProperty.exists?(prop1.id)).to be false
        expect(OrganizationMembershipProperty.exists?(prop2.id)).to be false
      end
    end

    describe "has_many :automation_invocations, inverse_of: :run_as" do
      it "prevents destroying organization_membership with associated invocations (foreign key constraint)" do
        automation = Automation.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        invocation = AutomationInvocation.create!(
          automation: automation,
          run_as: organization_membership,
          kind: :webhook,
          organization: organization,
          space: space
        )

        expect {
          organization_membership.destroy
        }.to raise_error(ActiveRecord::InvalidForeignKey)

        expect(AutomationInvocation.exists?(invocation.id)).to be true
        expect(OrganizationMembership.exists?(organization_membership.id)).to be true
      end
    end

    describe "has_many :team_memberships, dependent: :delete_all" do
      it "deletes all team_memberships when organization_membership is destroyed" do
        team1 = organization.teams.create!(name: "Team 1", shortcut: "@team1")
        team2 = organization.teams.create!(name: "Team 2", shortcut: "@team2")

        membership1 = TeamMembership.create!(
          organization: organization,
          team: team1,
          member: organization_membership
        )
        membership2 = TeamMembership.create!(
          organization: organization,
          team: team2,
          member: organization_membership
        )

        expect {
          organization_membership.destroy
        }.to change(TeamMembership, :count).by(-2)

        expect(TeamMembership.exists?(
          team_id: team1.id,
          member_id: membership1.member_id,
          member_type: "OrganizationMembership"
        )).to be false

        expect(TeamMembership.exists?(
          team_id: team2.id,
          member_id: membership2.member_id,
          member_type: "OrganizationMembership"
        )).to be false
      end
    end

    describe "has_many :space_memberships, dependent: :delete_all" do
      it "deletes all space_memberships when organization_membership is destroyed" do
        space1 = organization.spaces.create!(name: "Space 1")
        space2 = organization.spaces.create!(name: "Space 2")

        membership1 = SpaceMembership.create!(
          organization: organization,
          space: space1,
          member: organization_membership,
          role: :manager
        )
        membership2 = SpaceMembership.create!(
          organization: organization,
          space: space2,
          member: organization_membership,
          role: :manager
        )

        expect {
          organization_membership.destroy
        }.to change(SpaceMembership, :count).by(-2)

        expect(SpaceMembership.exists?(
          space_id: space1.id,
          member_id: membership1.member_id,
          member_type: "OrganizationMembership"
        )).to be false

        expect(SpaceMembership.exists?(
          space_id: space2.id,
          member_id: membership2.member_id,
          member_type: "OrganizationMembership"
        )).to be false
      end
    end

    describe "cascading behavior from parent models" do
      it "is destroyed when organization is destroyed" do
        new_org = Organization.create!(name: "Test Org")
        new_ou = OrganizationMembership.create!(
          organization: new_org,
          user: user,
          role: :member
        )

        ou_id = new_ou.id

        expect {
          new_org.destroy
        }.to change(OrganizationMembership, :count).by(-1)

        expect(OrganizationMembership.exists?(ou_id)).to be false
      end

      it "is destroyed when user is destroyed" do
        new_user = User.create!(
          email: "newuser@example.com",
          password: "password123",
          first_name: "New",
          last_name: "User"
        )
        new_ou = OrganizationMembership.create!(
          organization: organization,
          user: new_user,
          role: :member
        )

        ou_id = new_ou.id

        expect {
          new_user.destroy
        }.to change(OrganizationMembership, :count).by(-1)

        expect(OrganizationMembership.exists?(ou_id)).to be false
      end
    end
  end

  # Drives the unread badge rendered on every page by root#notifications.
  # Removing a member has to take their connected assistants with them. The tokens could no
  # longer authenticate, but the rows stayed forever, out of the owner's sight on the
  # authorized applications page, and a refresh token kept minting new ones.
  describe "OAuth credentials" do
    fixtures :oauth_applications, :oauth_access_grants, :oauth_access_tokens

    let(:membership) { organization_memberships(:om_is_pawel) }

    it "deletes the member's grants and tokens when they are removed" do
      grants = Doorkeeper::AccessGrant.where(organization_membership_id: membership.id)
      tokens = Doorkeeper::AccessToken.where(organization_membership_id: membership.id)
      expect(grants).to exist
      expect(tokens).to exist

      membership.destroy!

      expect(grants).not_to exist
      expect(tokens).not_to exist
    end

    # The foreign key, not only the association: paths that skip callbacks (`delete_all`,
    # raw SQL) must not leave credentials behind either.
    it "lets the database delete them when callbacks are skipped" do
      OrganizationMembership.where(id: membership.id).delete_all

      expect(Doorkeeper::AccessGrant.where(organization_membership_id: membership.id)).not_to exist
      expect(Doorkeeper::AccessToken.where(organization_membership_id: membership.id)).not_to exist
    end
  end

  describe "#unread_mentions_count" do
    let(:membership) { organization_memberships(:om_is_stefan) }
    let(:scope) { organizations(:is).documents }

    def seen_at(time)
      membership.organization_membership_properties.create!(
        key: "last_mention_seen_at",
        value: time.iso8601
      )
    end

    it "counts every mention when the user has never opened notifications" do
      # doc_mention_to_user, doc_mention_with_version, non_current_user_mention
      expect(membership.unread_mentions_count(scope)).to eq(3)
    end

    it "counts only mentions newer than last_mention_seen_at" do
      seen_at(4.days.ago)

      expect(membership.unread_mentions_count(scope)).to eq(2)
    end

    it "counts nothing once every mention has been seen" do
      seen_at(1.minute.from_now)

      expect(membership.unread_mentions_count(scope)).to eq(0)
    end

    it "ignores mentions in documents outside the given scope" do
      expect(membership.unread_mentions_count(Document.none)).to eq(0)
    end
  end
end
