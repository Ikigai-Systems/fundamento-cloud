require "rails_helper"

RSpec.describe Version, type: :model do
  fixtures :organizations, :spaces, :documents, :users, :organization_memberships, :versions, :document_editing_sessions

  describe "#contributors" do
    it "returns unique users from editing sessions for this version" do
      version = versions(:two_version_1)
      contributors = version.contributors

      expect(contributors).to be_an(ActiveRecord::Relation)
    end

    it "returns empty relation when no editing sessions linked" do
      version = versions(:two_version_1)
      version.editing_sessions.delete_all

      expect(version.contributors).to be_empty
    end

    it "returns contributors ordered by name" do
      version = versions(:two_version_1)
      contributors = version.contributors

      names = contributors.map(&:display_name)
      expect(names).to eq(names.sort)
    end
  end
end
