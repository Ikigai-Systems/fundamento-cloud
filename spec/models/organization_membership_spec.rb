require "rails_helper"

RSpec.describe OrganizationUser, type: :model do
  include ActionDispatch::TestProcess::FixtureFile

  fixtures :organizations, :users, :organization_memberships

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      organization_user = organization_memberships(:om_is_pawel)
      expect(organization_user.id).to be_a(String)
    end

    it "has string organization_user_id in api_tokens" do
      organization = organizations(:is)
      organization_user = OrganizationUser.create!(
        id: "testou01",
        organization: organization,
        user: users(:john),
        role: :member
      )
      api_token = organization_user.api_tokens.create!(
        title: "Test Token",
        organization: organization
      )

      expect(api_token.organization_user_id).to be_a(String)
      expect(api_token.organization_user_id).to eq(organization_user.id)
      expect(api_token.organization_user_id).to eq("testou01")
    end

    it "has string organization_user_id in favorites" do
      organization = organizations(:another)
      space = organization.spaces.create!(id: "anothersp2", name: "Another Space 2")
      organization_user = OrganizationUser.create!(
        id: "testou02",
        organization: organization,
        user: users(:john),
        role: :member
      )
      document = organization.documents.create!(
        id: "testdoc01",
        space_id: space.id
      )
      favorite = organization_user.favorites.create!(
        object: document
      )

      expect(favorite.organization_user_id).to be_a(String)
      expect(favorite.organization_user_id).to eq(organization_user.id)
      expect(favorite.organization_user_id).to eq("testou02")
    end

    it "has string run_as_id in automations" do
      organization = organizations(:another)
      space = organization.spaces.create!(id: "anothersp1", name: "Another Space")
      organization_user = OrganizationUser.create!(
        id: "testou03",
        organization: organization,
        user: users(:john),
        role: :manager
      )
      automation = organization_user.automations.create!(
        title: "Test Automation",
        organization: organization,
        space: space,
        kind: :webhook,
        formula: "1 + 1"
      )

      expect(automation.run_as_id).to be_a(String)
      expect(automation.run_as_id).to eq(organization_user.id)
      expect(automation.run_as_id).to eq("testou03")
    end
  end

  describe "associations" do
    it "belongs to organization" do
      organization_user = organization_memberships(:om_is_pawel)
      expect(organization_user.organization).to eq(organizations(:is))
    end

    it "belongs to user" do
      organization_user = organization_memberships(:om_is_pawel)
      expect(organization_user.user).to eq(users(:pawel))
    end
  end

  describe "roles" do
    it "can be manager" do
      organization_user = organization_memberships(:om_is_pawel)
      expect(organization_user.role).to eq("manager")
    end

    it "can be member" do
      organization_user = organization_memberships(:om_is_stefan)
      expect(organization_user.role).to eq("member")
    end
  end

  describe "dependent associations" do
    fixtures :spaces, :documents, :teams

    let(:organization) { organizations(:is) }
    let(:space) { spaces(:is_default) }
    let(:user) { users(:john) }

    let!(:organization_user) do
      OrganizationUser.create!(
        organization: organization,
        user: user,
        role: :member
      )
    end

    describe "has_many :api_tokens, dependent: :delete_all" do
      it "deletes all api_tokens when organization_user is destroyed" do
        # Create api tokens
        token1 = organization_user.api_tokens.create!(
          title: "Token 1",
          organization: organization
        )
        token2 = organization_user.api_tokens.create!(
          title: "Token 2",
          organization: organization
        )

        expect {
          organization_user.destroy
        }.to change(ApiToken, :count).by(-2)

        expect(ApiToken.exists?(token1.id)).to be false
        expect(ApiToken.exists?(token2.id)).to be false
      end

      it "can access api_tokens through organization_user" do
        token = organization_user.api_tokens.create!(
          title: "Test Token",
          organization: organization
        )

        expect(organization_user.api_tokens).to include(token)
      end

      it "foreign key is string type (NPI)" do
        token = organization_user.api_tokens.create!(
          title: "Test Token",
          organization: organization
        )

        expect(token.organization_user_id).to be_a(String)
        expect(token.organization_user_id).to eq(organization_user.id)
      end
    end

    describe "has_many :favorites, dependent: :delete_all" do
      it "deletes all favorites when organization_user is destroyed" do
        document1 = organization.documents.create!(space: space)
        document2 = organization.documents.create!(space: space)

        favorite1 = organization_user.favorites.create!(object: document1)
        favorite2 = organization_user.favorites.create!(object: document2)

        expect {
          organization_user.destroy
        }.to change(Favorite, :count).by(-2)

        expect(Favorite.exists?(favorite1.id)).to be false
        expect(Favorite.exists?(favorite2.id)).to be false
      end

      it "can create favorites through organization_user" do
        document = organization.documents.create!(space: space)
        favorite = organization_user.favorites.create!(object: document)

        expect(organization_user.favorites).to include(favorite)
      end

      it "foreign key is string type (NPI)" do
        document = organization.documents.create!(space: space)
        favorite = organization_user.favorites.create!(object: document)

        expect(favorite.organization_user_id).to be_a(String)
        expect(favorite.organization_user_id).to eq(organization_user.id)
      end
    end

    describe "has_many :reactions (ObjectReaction), dependent: :delete_all" do
      it "deletes all reactions when organization_user is destroyed" do
        document = organization.documents.create!(space: space)

        reaction1 = organization_user.reactions.create!(
          organization: organization,
          object: document,
          emoji: "👍"
        )
        reaction2 = organization_user.reactions.create!(
          organization: organization,
          object: document,
          emoji: "❤️"
        )

        expect {
          organization_user.destroy
        }.to change(ObjectReaction, :count).by(-2)

        expect(ObjectReaction.exists?(reaction1.id)).to be false
        expect(ObjectReaction.exists?(reaction2.id)).to be false
      end

      it "can create reactions through organization_user" do
        document = organization.documents.create!(space: space)
        reaction = organization_user.reactions.create!(
          organization: organization,
          object: document,
          emoji: "👍"
        )

        expect(organization_user.reactions).to include(reaction)
      end

      it "foreign key is string type (NPI)" do
        document = organization.documents.create!(space: space)
        reaction = organization_user.reactions.create!(
          organization: organization,
          object: document,
          emoji: "👍"
        )

        expect(reaction.organization_user_id).to be_a(String)
        expect(reaction.organization_user_id).to eq(organization_user.id)
      end
    end

    describe "has_many :organization_user_properties, dependent: :delete_all" do
      it "deletes all properties when organization_user is destroyed" do
        prop1 = organization_user.organization_user_properties.create!(

          key: "last_seen",
          value: "2024-01-01"
        )
        prop2 = organization_user.organization_user_properties.create!(
          key: "theme",
          value: "dark"
        )

        expect {
          organization_user.destroy
        }.to change(OrganizationUserProperty, :count).by(-2)

        expect(OrganizationUserProperty.exists?(prop1.id)).to be false
        expect(OrganizationUserProperty.exists?(prop2.id)).to be false
      end

      it "can create properties through organization_user" do
        prop = organization_user.organization_user_properties.create!(
          key: "last_seen",
          value: "2024-01-01"
        )

        expect(organization_user.organization_user_properties).to include(prop)
      end
    end

    describe "has_many :document_imports, dependent: :nullify" do
      let(:test_file) do
        fixture_file_upload(
          Rails.root.join("spec", "fixtures", "files", "documents", "simple_content.md"),
          "text/markdown"
        )
      end

      it "nullifies organization_user_id when organization_user is destroyed" do
        import = organization_user.document_imports.create!(
          organization: organization,
          space: space,
          file: test_file
        )

        import_id = import.id

        organization_user.destroy

        import.reload
        expect(import.organization_user_id).to be_nil
        expect(DocumentImport.exists?(import_id)).to be true
      end

      it "document_imports remain after organization_user is destroyed" do
        import1 = organization_user.document_imports.create!(
          organization: organization,
          space: space,
          file: test_file
        )
        import2 = organization_user.document_imports.create!(
          organization: organization,
          space: space,
          file: test_file
        )

        expect {
          organization_user.destroy
        }.not_to change(DocumentImport, :count)

        import1.reload
        import2.reload

        expect(import1.organization_user_id).to be_nil
        expect(import2.organization_user_id).to be_nil
      end

      it "can create document_imports through organization_user" do
        import = organization_user.document_imports.create!(
          organization: organization,
          space: space,
          file: test_file
        )

        expect(organization_user.document_imports).to include(import)
      end

      it "foreign key is string type (NPI)" do
        import = organization_user.document_imports.create!(
          organization: organization,
          space: space,
          file: test_file
        )

        expect(import.organization_user_id).to be_a(String)
        expect(import.organization_user_id).to eq(organization_user.id)
      end
    end

    describe "has_many :automations, inverse_of: :run_as" do
      it "can access automations where organization_user is run_as" do
        automation = organization_user.automations.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        expect(organization_user.automations).to include(automation)
        expect(automation.run_as).to eq(organization_user)
      end

      it "run_as_id is string type (NPI)" do
        automation = organization_user.automations.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        expect(automation.run_as_id).to be_a(String)
        expect(automation.run_as_id).to eq(organization_user.id)
      end

      it "prevents destroying organization_user with associated automations (foreign key constraint)" do
        automation = organization_user.automations.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        expect {
          organization_user.destroy
        }.to raise_error(ActiveRecord::InvalidForeignKey)

        expect(Automation.exists?(automation.id)).to be true
        expect(OrganizationUser.exists?(organization_user.id)).to be true
      end
    end

    describe "has_many :automation_invocations, inverse_of: :run_as" do
      it "can access automation_invocations where organization_user is run_as" do
        automation = Automation.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        invocation = AutomationInvocation.create!(
          automation: automation,
          run_as: organization_user,
          kind: :webhook,
          organization: organization,
          space: space
        )

        expect(organization_user.automation_invocations).to include(invocation)
        expect(invocation.run_as).to eq(organization_user)
      end

      it "run_as_id is string type (NPI)" do
        automation = Automation.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        invocation = AutomationInvocation.create!(
          automation: automation,
          run_as: organization_user,
          kind: :webhook,
          organization: organization,
          space: space
        )

        expect(invocation.run_as_id).to be_a(String)
        expect(invocation.run_as_id).to eq(organization_user.id)
      end

      it "prevents destroying organization_user with associated invocations (foreign key constraint)" do
        automation = Automation.create!(
          title: "Test Automation",
          organization: organization,
          space: space,
          kind: :webhook,
          formula: "1 + 1"
        )

        invocation = AutomationInvocation.create!(
          automation: automation,
          run_as: organization_user,
          kind: :webhook,
          organization: organization,
          space: space
        )

        expect {
          organization_user.destroy
        }.to raise_error(ActiveRecord::InvalidForeignKey)

        expect(AutomationInvocation.exists?(invocation.id)).to be true
        expect(OrganizationUser.exists?(organization_user.id)).to be true
      end
    end

    describe "has_many :team_memberships, dependent: :delete_all" do
      it "deletes all team_memberships when organization_user is destroyed" do
        team1 = organization.teams.create!(name: "Team 1", shortcut: "@team1")
        team2 = organization.teams.create!(name: "Team 2", shortcut: "@team2")

        membership1 = TeamMembership.create!(
          organization: organization,
          team: team1,
          member: organization_user
        )
        membership2 = TeamMembership.create!(
          organization: organization,
          team: team2,
          member: organization_user
        )

        expect {
          organization_user.destroy
        }.to change(TeamMembership, :count).by(-2)

        expect(TeamMembership.exists?(
          team_id: team1.id,
          member_id: membership1.member_id,
          member_type: "OrganizationUser"
        )).to be false

        expect(TeamMembership.exists?(
          team_id: team2.id,
          member_id: membership2.member_id,
          member_type: "OrganizationUser"
        )).to be false
      end

      it "can access team_memberships through organization_user" do
        team = organization.teams.create!(name: "Test Team", shortcut: "@test")
        membership = TeamMembership.create!(
          organization: organization,
          team: team,
          member: organization_user
        )

        expect(organization_user.team_memberships).to include(membership)
      end

      it "member_id is string type (NPI)" do
        team = organization.teams.create!(name: "Test Team", shortcut: "@test")
        membership = TeamMembership.create!(
          organization: organization,
          team: team,
          member: organization_user
        )

        expect(membership.member_id).to be_a(String)
        expect(membership.member_id).to eq(organization_user.id)
      end
    end

    describe "has_many :space_memberships, dependent: :delete_all" do
      it "deletes all space_memberships when organization_user is destroyed" do
        space1 = organization.spaces.create!(name: "Space 1")
        space2 = organization.spaces.create!(name: "Space 2")

        membership1 = SpaceMembership.create!(
          organization: organization,
          space: space1,
          member: organization_user,
          role: :manager
        )
        membership2 = SpaceMembership.create!(
          organization: organization,
          space: space2,
          member: organization_user,
          role: :manager
        )

        expect {
          organization_user.destroy
        }.to change(SpaceMembership, :count).by(-2)

        expect(SpaceMembership.exists?(
          space_id: space1.id,
          member_id: membership1.member_id,
          member_type: "OrganizationUser"
        )).to be false

        expect(SpaceMembership.exists?(
          space_id: space2.id,
          member_id: membership2.member_id,
          member_type: "OrganizationUser"
        )).to be false
      end

      it "can access space_memberships through organization_user" do
        membership = SpaceMembership.create!(
          organization: organization,
          space: space,
          member: organization_user,
          role: :manager
        )

        expect(organization_user.space_memberships).to include(membership)
      end

      it "member_id is string type (NPI)" do
        membership = SpaceMembership.create!(
          organization: organization,
          space: space,
          member: organization_user,
          role: :manager
        )

        expect(membership.member_id).to be_a(String)
        expect(membership.member_id).to eq(organization_user.id)
      end
    end

    describe "cascading behavior from parent models" do
      it "is destroyed when organization is destroyed" do
        new_org = Organization.create!(name: "Test Org")
        new_ou = OrganizationUser.create!(
          organization: new_org,
          user: user,
          role: :member
        )

        ou_id = new_ou.id

        expect {
          new_org.destroy
        }.to change(OrganizationUser, :count).by(-1)

        expect(OrganizationUser.exists?(ou_id)).to be false
      end

      it "is destroyed when user is destroyed" do
        new_user = User.create!(
          email: "newuser@example.com",
          password: "password123",
          first_name: "New",
          last_name: "User"
        )
        new_ou = OrganizationUser.create!(
          organization: organization,
          user: new_user,
          role: :member
        )

        ou_id = new_ou.id

        expect {
          new_user.destroy
        }.to change(OrganizationUser, :count).by(-1)

        expect(OrganizationUser.exists?(ou_id)).to be false
      end
    end
  end
end
