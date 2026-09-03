require "rails_helper"

RSpec.describe TableVersionSnapshotJob, type: :job do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  it "creates the version for the changes that accumulated" do
    Current.set(user: users(:pawel), change_source: "ui") do
      tables_cells(:projects_jira_key).update!(value: "A")
    end

    expect { described_class.perform_now(table) }.to change { table.versions.count }.by(1)
  end

  # A broken linked list is a data problem in the table; retrying forever would just
  # spin, so it is reported and dropped.
  it "reports a broken linked list instead of failing the job" do
    allow(table).to receive(:columns_in_order).and_raise(IndexError, "Incomplete linked list")
    expect(Sentry).to receive(:capture_exception).with(instance_of(IndexError), hash_including(:extra))

    Current.set(user: users(:pawel), change_source: "ui") do
      tables_cells(:projects_jira_key).update!(value: "A")
    end

    expect { described_class.perform_now(table) }.not_to raise_error
  end
end
