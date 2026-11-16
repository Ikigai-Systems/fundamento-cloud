require "rails_helper"

RSpec.describe Organization, type: :model do
  fixtures :organizations, :users

  describe "validations" do
    it "requires a name" do
      organization = Organization.new
      expect(organization.valid?).to be false
      expect(organization.errors[:name]).to include("can't be blank")
    end

    it "defaults the time zone to UTC" do
      expect(Organization.new(name: "Zone test").time_zone).to eq("UTC")
    end

    it "accepts an IANA time zone" do
      expect(Organization.new(name: "Zone test", time_zone: "Europe/Warsaw")).to be_valid
    end

    it "rejects an unknown time zone" do
      organization = Organization.new(name: "Zone test", time_zone: "Mars/Olympus")

      expect(organization).not_to be_valid
      expect(organization.errors[:time_zone]).to include("is not a valid time zone")
    end

    it "offers only valid time zones as choices" do
      expect(Organization.time_zone_choices).to include("UTC", "Europe/Warsaw")
      expect(Organization.time_zone_choices - TZInfo::Timezone.all_identifiers).to be_empty
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
