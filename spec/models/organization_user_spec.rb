require "rails_helper"

RSpec.describe OrganizationUser, type: :model do
  fixtures :organizations, :users, :organization_users

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      organization_user = organization_users(:ou_is_pawel)
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
      organization_user = organization_users(:ou_is_pawel)
      expect(organization_user.organization).to eq(organizations(:is))
    end

    it "belongs to user" do
      organization_user = organization_users(:ou_is_pawel)
      expect(organization_user.user).to eq(users(:pawel))
    end
  end

  describe "roles" do
    it "can be manager" do
      organization_user = organization_users(:ou_is_pawel)
      expect(organization_user.role).to eq("manager")
    end

    it "can be member" do
      organization_user = organization_users(:ou_is_stefan)
      expect(organization_user.role).to eq("member")
    end
  end
end
