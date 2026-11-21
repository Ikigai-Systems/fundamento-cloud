require "rails_helper"

RSpec.describe ObjectContent do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:document) { documents(:one) }

  it "stores the sync blob for its owner" do
    document.create_content!(sync: "yjs-bytes".b)

    expect(document.reload.content.sync).to eq("yjs-bytes".b)
  end

  describe "sync_version" do
    it "starts at the version of the first write and moves with every write of the sync blob" do
      content = document.create_content!(sync: "one".b)
      first = content.sync_version

      content.update!(sync: "two".b)
      content.update!(sync: "three".b)

      expect(content.reload.sync_version).to eq(first + 2)
    end

    it "counts both writes of two writers that loaded the same row" do
      content = document.create_content!(sync: "one".b)
      first = content.sync_version
      other = ObjectContent.find(content.id)

      content.update!(sync: "two".b)
      other.update!(sync: "three".b)

      expect(ObjectContent.find(content.id).sync_version).to eq(first + 2)
    end

    it "does not move when the blob is saved unchanged" do
      content = document.create_content!(sync: "same".b)

      expect { content.update!(sync: "same".b) }.not_to change { content.reload.sync_version }
    end

    it "is what the document reports, and 0 for one with no content yet" do
      expect(document.sync_version).to eq(document.content&.sync_version.to_i)

      document.content&.destroy
      expect(document.reload.sync_version).to eq(0)
    end
  end

  # Without this, documents.updated_at would quietly come to mean "title or icon changed"
  # and Document.recently_updated would stop reflecting edits.
  it "touches the owner when content changes, so recently_updated keeps working" do
    content = document.create_content!(sync: "before".b)
    document.update_column(:updated_at, 1.week.ago)
    was = document.reload.updated_at

    content.update!(sync: "after".b)

    expect(document.reload.updated_at).to be > was
  end

  it "orders Document.recently_updated by content edits" do
    other = documents(:two)
    document.update_column(:updated_at, 1.week.ago)
    other.update_column(:updated_at, 1.day.ago)

    document.create_content!(sync: "edited".b)

    expect(Document.recently_updated.first).to eq(document)
  end

  it "is removed with its owner" do
    document.create_content!(sync: "bytes".b)

    expect { document.destroy! }.to change(described_class, :count).by(-1)
  end

  it "allows only one row per owner" do
    document.create_content!(sync: "first".b)

    expect {
      described_class.create!(owner: document, sync: "second".b)
    }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "keeps content for different owners apart" do
    documents(:one).create_content!(sync: "one".b)
    documents(:two).create_content!(sync: "two".b)

    expect(documents(:one).reload.content.sync).to eq("one".b)
    expect(documents(:two).reload.content.sync).to eq("two".b)
  end

  # The blob is rewritten on essentially every keystroke, so an audit row per write would
  # be pure cost -- and would store a copy of every version of every document.
  it "writes no audit records" do
    expect {
      document.create_content!(sync: "first".b).update!(sync: "second".b)
    }.not_to change { Audited::Audit.where(auditable_type: "ObjectContent").count }
  end

  # The whole point of the move: the blob must not be reachable from a documents query, so
  # no future SELECT * can drag it back in. This is the assertion that would have caught
  # the command palette regression.
  describe "the blob is off the documents row" do
    def documents_sql
      queries = []
      ActiveSupport::Notifications.subscribed(->(*, payload) {
        queries << payload[:sql] if payload[:sql].to_s.include?(%q{FROM "documents"})
      }, "sql.active_record") { yield }
      queries
    end

    it "is not selected by a plain Document query" do
      queries = documents_sql { Document.where(organization: organizations(:is)).to_a }

      expect(queries).to be_present
      expect(queries).to all(satisfy { |sql| !sql.include?("sync") })
    end

    it "is not exposed as an attribute on Document" do
      expect(document).not_to respond_to(:sync)
      expect(Document.column_names).not_to include("sync")
    end
  end
end
