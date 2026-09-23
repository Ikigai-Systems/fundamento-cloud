require "rails_helper"

# The trash is only a recovery window if something closes it. Without this job trashed
# organizations accumulate forever, and the rows they keep alive -- every space,
# document, table and blob under them -- accumulate with them.
RSpec.describe TrashPurgeJob do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  def trash_at(record, time)
    record.trash!(by: user)
    record.update_columns(deleted_at: time)
  end

  it "destroys organizations trashed longer ago than the retention window" do
    trash_at(organization, (Trashable::RETENTION + 1.day).ago)

    described_class.perform_now

    expect(Organization.find_by(id: organization.id)).to be_nil
  end

  it "destroys the children of a purged organization" do
    space_ids = organization.spaces.pluck(:id)
    expect(space_ids).not_to be_empty
    trash_at(organization, (Trashable::RETENTION + 1.day).ago)

    described_class.perform_now

    expect(Space.where(id: space_ids)).to be_empty
  end

  it "leaves organizations still inside the retention window alone" do
    trash_at(organization, (Trashable::RETENTION - 1.day).ago)

    described_class.perform_now

    expect(organization.reload).to be_trashed
  end

  it "leaves organizations that are not trashed alone" do
    described_class.perform_now

    expect(Organization.find_by(id: organization.id)).to be_present
  end

  # A clock skew or a bad backfill should never be able to turn the purge into an
  # immediate delete.
  it "refuses to purge a record whose deleted_at is in the future" do
    trash_at(organization, 1.day.from_now)

    described_class.perform_now

    expect(Organization.find_by(id: organization.id)).to be_present
  end

  it "is idempotent" do
    trash_at(organization, (Trashable::RETENTION + 1.day).ago)

    described_class.perform_now
    expect { described_class.perform_now }.not_to raise_error

    expect(Organization.find_by(id: organization.id)).to be_nil
  end
end
