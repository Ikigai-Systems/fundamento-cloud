require "rails_helper"

RSpec.describe Tables::VersionSnapshotService, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }

  before { Flipper.enable(:table_versioning) }

  def edit_as(user, cell, value)
    Current.set(user: user, change_source: "ui") { cell.update!(value: value) }
  end

  describe "coalescing" do
    it "rolls a burst of edits into one version" do
      edit_as(pawel, tables_cells(:projects_jira_key), "A")
      edit_as(pawel, tables_cells(:projects_jira_name), "B")
      edit_as(pawel, tables_cells(:projects_confluence_key), "C")

      expect { described_class.new(table).call }.to change { table.versions.count }.by(1)
      expect(table.versions.last.summary).to include("cells_changed" => 3)
    end

    it "claims the events it covers, so the next run does not weigh them again" do
      edit_as(pawel, tables_cells(:projects_jira_key), "A")

      version = described_class.new(table).call

      expect(table.change_events.unlinked).to be_empty
      expect(version.change_events.count).to eq 1
    end

    it "does nothing when there is nothing to record" do
      expect { described_class.new(table).call }.not_to change { table.versions.count }
    end

    it "still records a baseline for an untouched table" do
      expect { described_class.new(table, kind: :initial).call }.to change { table.versions.count }.by(1)
      expect(table.versions.last).to be_initial
    end
  end

  # Someone types and undoes it: the events happened, but the table did not change, and
  # an empty entry in the timeline is worse than no entry.
  describe "when the content ends up unchanged" do
    it "keeps the version out of the timeline but still claims the events" do
      described_class.new(table, kind: :initial).call
      original = tables_cells(:projects_jira_key).value

      edit_as(pawel, tables_cells(:projects_jira_key), "TEMPORARY")
      edit_as(pawel, tables_cells(:projects_jira_key), original)

      expect { described_class.new(table).call }.not_to change { table.versions.count }
      expect(table.change_events.unlinked).to be_empty
    end
  end

  describe "attribution" do
    it "credits whoever made most of the changes and lists everyone as a contributor" do
      edit_as(pawel, tables_cells(:projects_jira_key), "A")
      edit_as(pawel, tables_cells(:projects_jira_name), "B")
      edit_as(stefan, tables_cells(:projects_confluence_key), "C")

      version = described_class.new(table).call

      expect(version.created_by).to eq pawel
      expect(version.contributors).to contain_exactly(pawel, stefan)
    end

    it "leaves the author blank when nothing was attributed" do
      Current.set(user: nil, change_source: "system") { tables_cells(:projects_jira_key).update!(value: "A") }

      expect(described_class.new(table).call.created_by).to be_nil
    end
  end

  describe "sequential ids" do
    it "numbers versions per table starting at one" do
      described_class.new(table, kind: :initial).call
      edit_as(pawel, tables_cells(:projects_jira_key), "A")
      described_class.new(table).call

      expect(table.versions.chronological.map(&:sequential_id)).to eq [1, 2]
    end

    it "numbers each table independently" do
      other = tables_tables(:orders)

      described_class.new(table, kind: :initial).call
      described_class.new(other, kind: :initial).call

      expect(other.versions.last.sequential_id).to eq 1
    end
  end

  it "records the dimensions and attaches the snapshot" do
    version = described_class.new(table, kind: :initial).call

    expect(version).to have_attributes(row_count: 3, column_count: 4)
    expect(version.snapshot).to be_attached
    expect(version.content_digest).to be_present
  end
end
