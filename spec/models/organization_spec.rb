require "rails_helper"

RSpec.describe Organization, type: :model do
  fixtures :organizations, :users

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
