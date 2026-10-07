require "rails_helper"

# Putting rows back. Additive only: insert what is missing, never touch what is there.
#
# The scenario this exists for is the ordinary one -- somebody deleted a document and wants
# it back -- so the tests are written as that story rather than as table mechanics.
RSpec.describe Tenant::RestoreService do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", "tables/columns", "tables/rows", :object_contents, :versions,
           :object_comments, :object_references, :tags, :object_tags

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

  # Versions have integer ids, which a restore cannot keep: the sequence is shared by every
  # tenant. So the version comes back under a new id, and everything that recorded the old one
  # has to be rewritten -- a mention notes the version it was made in. Left alone, it would
  # point at whatever row holds that number now.
  describe "a deleted document's versions" do
    let(:document) { documents(:two) }
    let!(:version) { versions(:two_version_1) }
    let!(:reference_id) { object_references(:non_current_user_mention).id }

    before do
      archive
      document.destroy!
    end

    it "come back with what pointed at them rewritten to their new ids" do
      restore

      restored = Version.find_by!(document_id: document.id, sequential_id: version.sequential_id)
      expect(ObjectReference.find(reference_id).source_version_id).to eq(restored.id)
    end

    # The reason the id is dropped. By the time anyone restores, the archived number can belong
    # to another row -- another document's here, another tenant's in production.
    it "do not take an id another row now holds" do
      Version.insert!({
        id: version.id, document_id: documents(:one).id, sequential_id: 999,
        created_at: Time.current, updated_at: Time.current,
      })

      restore

      expect(Version.find(version.id).document_id).to eq(documents(:one).id)
      expect(Version.where(document_id: document.id, sequential_id: version.sequential_id)).to exist
    end
  end

  # A space names its home document and the document names its space, so neither can go in
  # first. The space is inserted without one and given it back in a second pass.
  it "gives a restored space back its home document" do
    space = spaces(:is_default)
    home = documents(:one)
    space.update!(home_document: home)
    archive
    space.destroy!

    restore

    expect(Space.find(space.id).home_document_id).to eq(home.id)
  end

  # No table is unmatchable today, so this takes a key away to make one: object_tags is
  # integer-keyed and its unique index is the only way to recognise a row. The DDL is rolled
  # back with the example's transaction.
  it "skips a table it cannot match rather than duplicating its rows" do
    ActiveRecord::Base.connection.remove_index :object_tags,
      name: "index_object_tags_on_tag_id_and_object_type_and_object_id"
    before_count = ObjectTag.count
    expect(before_count).to be_positive

    result = restore

    expect(result.unmatchable).to include("object_tags")
    expect(ObjectTag.count).to eq(before_count)
  end

  it "leaves rows that are already present alone" do
    before_updated = organization.all_documents.map { |d| [d.id, d.updated_at.to_f] }.to_h

    restore

    after_updated = organization.all_documents.map { |d| [d.id, d.updated_at.to_f] }.to_h
    expect(after_updated).to eq(before_updated)
  end

  # Restoring a document against real data once inserted six comments that had never gone away,
  # because object_comments had no key that could tell the archived row from the one already
  # there. It has a string primary key now; this keeps the story from repeating.
  it "does not duplicate rows that are already there" do
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
