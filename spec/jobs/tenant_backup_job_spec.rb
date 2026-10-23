require "rails_helper"

# Tenant exports shipped with nothing to run them, so an archive only existed if somebody
# remembered to take one. A backup that has to be remembered is not one.
RSpec.describe TenantBackupJob do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  it "is on the recurring schedule" do
    classes = YAML.load_file(Rails.root.join("config/recurring.yml")).values.map { |entry| entry["class"] }

    expect(classes).to include(described_class.name)
  end

  describe "scheduling" do
    include ActiveJob::TestHelper

    it "is enqueued where an exports service is configured" do
      allow(Rails.application.config).to receive(:tenant_export_service).and_return(:exports)

      expect { described_class.perform_later }.to have_enqueued_job(described_class)
    end

    # Otherwise every night adds a full copy of every tenant to the application's own
    # bucket, which nothing expires.
    it "is not enqueued without one" do
      allow(Rails.application.config).to receive(:tenant_export_service).and_return(nil)

      expect { described_class.perform_later }.not_to have_enqueued_job(described_class)
    end
  end

  it "exports every organization" do
    described_class.perform_now

    expect(TenantExport.completed.pluck(:organization_id)).to match_array(Organization.kept.ids)
  end

  it "skips organizations in the trash" do
    organization.trash!(by: user)

    described_class.perform_now

    expect(TenantExport.where(organization: organization)).to be_empty
  end

  # A run cut short by a deploy is retried, and should continue rather than start over.
  it "skips organizations backed up in the last day" do
    TenantExport.run!(organization)

    expect { described_class.perform_now }.to change { TenantExport.where(organization: organization).count }.by(0)
  end

  it "backs an organization up again once its last archive is a day old" do
    TenantExport.run!(organization).update_columns(created_at: 1.day.ago)

    expect { described_class.perform_now }.to change { TenantExport.where(organization: organization).count }.by(1)
  end

  it "carries on past an organization whose export fails" do
    failing = Organization.kept.order(:id).first
    allow(Tenant::ExportBuilder).to receive(:new).and_call_original
    allow(Tenant::ExportBuilder).to receive(:new).with(failing).and_raise("boom")
    allow(Sentry).to receive(:capture_exception)

    described_class.perform_now

    expect(TenantExport.where(organization: failing).last).to be_failed
    expect(TenantExport.completed.pluck(:organization_id)).to match_array(Organization.kept.ids - [failing.id])
    expect(Sentry).to have_received(:capture_exception).once
  end
end
