require "rails_helper"

# Putting rows back. Additive only: insert what is missing, never touch what is there.
#
# The scenario this exists for is the ordinary one -- somebody deleted a document and wants
# it back -- so the tests are written as that story rather than as table mechanics.
RSpec.describe Tenant::RestoreService do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", "tables/columns", "tables/rows", :object_contents, :versions,
           :object_comments

  let(:organization) { organizations(:is) }
  let(:archive) { Tenant::ExportBuilder.new(organization).build }
  let(:reader) { Tenant::ExportReader.new(archive.io) }

  after { archive.io&.close! }

  def restore
    described_class.new(organization: organization, reader: reader).call
  end

  describe "a deleted document" do
    let!(:document) { organization.all_documents.first }
    let!(:document_id) { document.id }
    let!(:title) { document.title }

    before do
      archive # capture the state that still has it
      document.destroy!
    end

    it "comes back with the id it had" do
      restore

      restored = Document.find_by(id: document_id)
      expect(restored).to be_present
      expect(restored.title).to eq(title)
    end

    # The nanoid is what makes a restore cheap. Content embeds document and table ids --
    # mentions, chart columns, formulas -- so putting a row back under a new id would leave
    # every reference to it pointing at nothing.
    it "keeps its original id rather than being assigned a new one" do
      restore

      expect(Document.where(title: title).pluck(:id)).to eq([document_id])
    end

    it "brings its content back with it" do
      restore

      expect(ObjectContent.find_by(owner_type: "Document", owner_id: document_id)).to be_present
    end
  end

  it "leaves rows that are already present alone" do
    before_updated = organization.all_documents.map { |d| [d.id, d.updated_at.to_f] }.to_h

    restore

    after_updated = organization.all_documents.map { |d| [d.id, d.updated_at.to_f] }.to_h
    expect(after_updated).to eq(before_updated)
  end

  # Restoring a document against real data inserted six comments that had never gone away,
  # because object_comments has no unique key and nothing could tell the archived row from
  # the one already there. Duplicating a user's comments is worse than not restoring them.
  it "does not duplicate rows it cannot match" do
    before_count = ObjectComment.count
    expect(before_count).to be_positive

    restore

    expect(ObjectComment.count).to eq(before_count)
  end

  it "reports what it did" do
    document = organization.all_documents.first
    archive
    document.destroy!

    result = restore

    expect(result.inserted["documents"]).to eq(1)
  end

  # The planner exists to be consulted, not admired. A restore that runs into a conflict it
  # was warned about leaves the tenant half restored.
  it "refuses to run when the plan is blocked" do
    table = tables_tables(:projects)
    name = table.name
    space = table.space
    archive
    table.destroy!
    Table.create!(name: name, space: space, organization: organization)

    expect { restore }.to raise_error(described_class::Blocked, /conflict/i)
  end

  it "refuses an archive belonging to another organization" do
    other = Tenant::ExportBuilder.new(organizations(:hc)).build

    begin
      service = described_class.new(organization: organization, reader: Tenant::ExportReader.new(other.io))
      expect { service.call }.to raise_error(Tenant::RestorePlanner::WrongOrganization)
    ensure
      other.io&.close!
    end
  end
end
