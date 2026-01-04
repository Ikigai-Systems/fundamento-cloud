require "rails_helper"

RSpec.describe Organization, type: :model do
  fixtures :organizations, :users

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      organization = organizations(:is)
      expect(organization.id).to be_a(String)
    end

    it "has string organization_id in api_tokens" do
      user = users(:pawel)
      organization = Organization.create!(id: "testorg01", name: "Test Organization")
      organization_user = organization.organization_users.create!(user: user, role: :manager)
      api_token = organization.api_tokens.create!(
        title: "Test Token",
        organization_user: organization_user
      )

      expect(api_token.organization_id).to be_a(String)
      expect(api_token.organization_id).to eq(organization.id)
      expect(api_token.organization_id).to eq("testorg01")
    end

    it "has string organization_id in spaces" do
      organization = Organization.create!(id: "testorg02", name: "Test Organization 2")
      space = organization.spaces.first

      expect(space.organization_id).to be_a(String)
      expect(space.organization_id).to eq(organization.id)
      expect(space.organization_id).to eq("testorg02")
    end

    it "has string organization_id in documents" do
      organization = Organization.create!(id: "testorg03", name: "Test Organization 3")
      space = organization.spaces.first
      document = organization.documents.create!(
        id: "testdoc01",
        space_id: space.id
      )

      expect(document.organization_id).to be_a(String)
      expect(document.organization_id).to eq(organization.id)
      expect(document.organization_id).to eq("testorg03")
    end

    it "has string organization_id in automations" do
      organization = Organization.create!(id: "testorg04", name: "Test Organization 4")
      space = organization.spaces.first
      automation = organization.automations.create!(
        title: "Test Automation",
        space: space,
        kind: :webhook,
        formula: "1 + 1"
      )

      expect(automation.organization_id).to be_a(String)
      expect(automation.organization_id).to eq(organization.id)
      expect(automation.organization_id).to eq("testorg04")
    end
  end

  describe "validations" do
    it "requires a name" do
      organization = Organization.new
      expect(organization.valid?).to be false
      expect(organization.errors[:name]).to include("can't be blank")
    end
  end

  describe "default space creation" do
    it "creates a default space after creation" do
      organization = Organization.create!(name: "Test Organization")
      expect(organization.spaces.count).to eq(1)
      expect(organization.spaces.first.name).to eq("Test Organization Space")
    end
  end
end
