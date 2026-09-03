require "rails_helper"

RSpec.describe TableVersionBackfillJob, type: :job do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  it "gives tables that predate versioning a baseline" do
    expect { described_class.perform_now }
      .to have_enqueued_job(TableVersionSnapshotJob).at_least(:once)
  end

  it "self-terminates once every table has one" do
    Table.without_archived.find_each { |t| Tables::VersionSnapshotService.new(t, kind: :initial).call }

    expect { described_class.perform_now }.not_to have_enqueued_job(TableVersionSnapshotJob)
  end
end
