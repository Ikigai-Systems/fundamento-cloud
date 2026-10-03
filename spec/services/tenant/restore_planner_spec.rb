require "rails_helper"

# What a restore *would* do, worked out before anything is written.
#
# The value is entirely in being trustworthy at three in the morning: an operator decides
# whether to run a restore from this, so it has to be complete about what it would touch
# and honest about what it cannot do.
RSpec.describe Tenant::RestorePlanner do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", "tables/columns", "tables/rows", :object_contents, :api_tokens

  let(:organization) { organizations(:is) }
  let(:archive) { Tenant::ExportBuilder.new(organization).build }
  let(:reader) { Tenant::ExportReader.new(archive.io) }

  after { archive.io&.close! }

  def plan(mode: :additive)
    described_class.new(organization: organization, reader: reader, mode: mode).call
  end

  # The one guarantee that matters. Everything else is advice; this is the promise.
  it "writes nothing" do
    archive # build it before we start listening

    statements = []
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
      statements << payload[:sql] if payload[:sql] =~ /\A\s*(INSERT|UPDATE|DELETE)\b/i
    end

    begin
      plan
    ensure
      ActiveSupport::Notifications.unsubscribe(subscriber)
    end

    expect(statements).to eq([])
  end

  # Unmatchable tables are excluded here on purpose: their rows count as "would insert"
  # precisely because nothing can prove they are already present, so they never reach zero.
  it "reports nothing to insert for tables it can match" do
    matchable = plan.rows_to_insert.except(*plan.unmatchable)

    expect(matchable.values.sum).to eq(0)
    expect(plan.rows_already_present["documents"]).to eq(organization.all_documents.count)
  end

  # Integer primary keys are reassigned on restore, so an archived id says nothing about
  # whether that row is already present -- matching has to go through a natural key. Before
  # this was true the planner reported every bigint-keyed row as missing and then as a
  # conflict: 448 rows to insert and 427 conflicts against an archive of the current state.
  it "recognises bigint-keyed rows it already has" do
    expect(plan.rows_to_insert["table_cells"].to_i).to eq(0)
    expect(plan.rows_to_insert["object_contents"].to_i).to eq(0)
    expect(plan.conflicts).to eq([])
  end

  # Eight exported tables used to be unmatchable -- five with no unique key at all, three whose
  # only key the export redacts -- and a restore duplicated their rows rather than recognising
  # them. Each has since been given a string primary key or a declared unique index, so the
  # answer here should now be "none".
  it "can match every exported table" do
    expect(plan.unmatchable).to eq([]),
      "a restore cannot recognise rows in #{plan.unmatchable.join(', ')}, so it would " \
      "duplicate them on every run. See .claude/rules/tenant-archive.md."
  end

  # Nothing triggers the guard any more, which is exactly why it needs a test of its own: a
  # path that never runs is a path that quietly stops working. The table has to be one that is
  # still integer-keyed -- a string key is matched on the id before a unique index is ever
  # looked for -- so object_contents stands in, and denying it a key is enough to exercise the
  # report.
  it "reports a table it cannot match rather than guessing at its rows" do
    allow_any_instance_of(described_class)
      .to receive(:usable_unique_index)
      .and_wrap_original { |original, table, row| table == "object_contents" ? nil : original.call(table, row) }

    result = plan

    expect(result.unmatchable).to eq(["object_contents"])
    expect(result.rows_to_insert["object_contents"]).to be > 0
  end

  # Only tables actually carrying rows are named. A warning about a table this tenant does
  # not use is noise, and noise in a 3am plan is worse than silence.
  it "does not name tables the archive has no rows for" do
    allow_any_instance_of(described_class).to receive(:usable_unique_index).and_return(nil)

    expect(plan.unmatchable).not_to include("attachments", "pack_versions")
  end

  it "counts a deleted row as one that would be restored" do
    archive # capture the state that still has the document
    document = organization.all_documents.first
    document.destroy!

    expect(plan.rows_to_insert["documents"]).to eq(1)
  end

  # The landmine the plan names: a record deleted and recreated under the same name takes
  # the unique index with it, so the archived row cannot go back without a decision. Being
  # told beforehand is the difference between a choice and a half-finished restore.
  it "reports a unique-index conflict rather than discovering it mid-restore" do
    archive
    table = tables_tables(:projects)
    original_name = table.name
    space = table.space
    table.destroy!
    Table.create!(name: original_name, space: space, organization: organization)

    conflict = plan.conflicts.find { |c| c[:table] == "tables" }

    expect(conflict).to be_present
    expect(conflict[:columns]).to include("name")
    expect(plan).to be_blocked
  end

  it "is not blocked when there are no conflicts" do
    expect(plan.conflicts).to eq([])
    expect(plan).not_to be_blocked
  end

  it "refuses an archive belonging to a different organization" do
    other = Tenant::ExportBuilder.new(organizations(:hc)).build

    begin
      planner = described_class.new(
        organization: organization,
        reader: Tenant::ExportReader.new(other.io),
        mode: :additive,
      )
      expect { planner.call }.to raise_error(described_class::WrongOrganization)
    ensure
      other.io&.close!
    end
  end
end
