require "rails_helper"

# A record of an archive that exists, so that "do we have a recent backup of this tenant?"
# is a question the database answers rather than one somebody has to go and look in a
# bucket for.
RSpec.describe TenantExport do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }

  describe ".run!" do
    subject(:export) { described_class.run!(organization) }

    it "attaches the archive and records what is in it" do
      expect(export).to be_completed
      expect(export.archive).to be_attached
      expect(export.byte_size).to be_positive
      expect(export.row_counts["documents"]).to eq(organization.all_documents.count)
    end

    it "records the digest of the bytes it stored" do
      expect(export.digest).to match(/\A[0-9a-f]{64}\z/)
    end

    # The archive is a full copy of a tenant. Knowing when one was taken, and being able
    # to prove the bytes have not changed since, is most of what makes it trustworthy.
    it "names the archive after the organization and the moment" do
      expect(export.archive.filename.to_s).to include(organization.id)
      expect(export.archive.filename.to_s).to end_with(".tar")
    end

    it "marks the export failed and re-raises when the build cannot finish" do
      allow(Tenant::ExportBuilder).to receive(:new).and_raise(ActiveRecord::StatementInvalid, "boom")

      expect { described_class.run!(organization) }.to raise_error(ActiveRecord::StatementInvalid)

      expect(described_class.last).to be_failed
      expect(described_class.last.error).to include("boom")
    end
  end
end
