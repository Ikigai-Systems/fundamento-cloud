require "rails_helper"

RSpec.describe TenantExportJob do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }

  it "produces a completed export for the organization" do
    expect { described_class.perform_now(organization) }.to change(TenantExport, :count).by(1)

    expect(TenantExport.last).to be_completed
    expect(TenantExport.last.organization).to eq(organization)
  end

  # Exports read the whole tenant. Two at once on a burstable instance is how a backup
  # becomes an incident, so the job is the thing that serialises them.
  it "runs one export at a time" do
    expect(described_class.new.class.concurrency_limit_key).to be_present
  end
end
