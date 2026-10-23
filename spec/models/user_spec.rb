require "rails_helper"

RSpec.describe User, type: :model do
  fixtures :users, :organizations, :organization_memberships

  # Every path that asks "which organizations does this user belong to" -- the picker,
  # EnsureOrganization, the ActionCable connection check, UserPolicy, the MCP tools --
  # goes through this one association. Scoping it here is what keeps a trashed
  # organization out of all of them at once.
  describe "#organizations" do
    it "excludes trashed organizations" do
      user = users(:pawel)
      trashed = user.organizations.first
      expect(trashed).to be_present

      trashed.trash!(by: user)

      expect(user.organizations.reload).not_to include(trashed)
    end
  end
end
