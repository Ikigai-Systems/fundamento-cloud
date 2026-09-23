require "rails_helper"

# Deleting an organization used to be a hard DELETE that cascaded through a dozen
# associations, with no way back short of a point-in-time restore of the whole database.
# Trashing marks the record and touches nothing else, which is what makes putting it back
# a single UPDATE.
RSpec.describe Trashable do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:organization) { organizations(:is) }
  let(:user) { users(:pawel) }

  describe "#trash!" do
    it "marks the record as trashed without destroying it" do
      organization.trash!(by: user)

      expect(Organization.find_by(id: organization.id)).to be_present
      expect(organization.reload).to be_trashed
      expect(organization.deleted_at).to be_within(5.seconds).of(Time.current)
      expect(organization.deleted_by_id).to eq(user.id)
    end

    # The cheap restore depends on this. `destroy` would cascade through a dozen
    # `dependent:` associations; trashing has to leave every one of them alone.
    it "leaves the record's children untouched" do
      spaces = organization.spaces.to_a
      memberships = organization.organization_memberships.to_a
      expect(spaces).not_to be_empty
      expect(memberships).not_to be_empty

      organization.trash!(by: user)

      expect(Space.where(id: spaces.map(&:id)).count).to eq(spaces.size)
      expect(OrganizationMembership.where(id: memberships.map(&:id)).count).to eq(memberships.size)
    end
  end

  describe "#untrash!" do
    it "clears the trash marks and restores the record" do
      organization.trash!(by: user)

      organization.untrash!

      expect(organization.reload).not_to be_trashed
      expect(organization.deleted_at).to be_nil
      expect(organization.deleted_by_id).to be_nil
    end
  end

  describe "scopes" do
    it "partitions records into kept and trashed" do
      trashed = organizations(:hc)
      trashed.trash!(by: user)

      expect(Organization.kept).to include(organization)
      expect(Organization.kept).not_to include(trashed)
      expect(Organization.trashed).to include(trashed)
      expect(Organization.trashed).not_to include(organization)
    end
  end
end
