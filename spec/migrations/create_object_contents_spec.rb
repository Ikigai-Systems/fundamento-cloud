# frozen_string_literal: true
require "rails_helper"
require Rails.root.join("db/migrate/20260909154256_create_object_contents")

# Self-hosted runs this unattended during db:prepare on boot, where a failure means a
# failed upgrade and a duplicate row means a violated unique index. Neither path is
# exercised by simply running the migration once in development.
RSpec.describe CreateObjectContents do
  fixtures :organizations, :spaces

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  around do |example|
    was_verbose = ActiveRecord::Migration.verbose
    ActiveRecord::Migration.verbose = false
    example.run
    ActiveRecord::Migration.verbose = was_verbose
  end

  # The migration reads documents.sync with raw SQL, which is the point: the column is on
  # ignored_columns, so the model cannot see it any more.
  def create_document(id, sync:, updated_at: 3.days.ago)
    ActiveRecord::Base.connection.execute(<<~SQL)
      INSERT INTO documents (id, title, organization_id, space_id, sync, created_at, updated_at)
      VALUES (
        #{ActiveRecord::Base.connection.quote(id)},
        'Doc',
        #{ActiveRecord::Base.connection.quote(organization.id)},
        #{ActiveRecord::Base.connection.quote(space.id)},
        #{sync.nil? ? "NULL" : "decode('#{sync.unpack1("H*")}', 'hex')"},
        NOW(),
        #{ActiveRecord::Base.connection.quote(updated_at)}
      )
    SQL
  end

  def backfill = described_class.new.send(:backfill)

  def content_for(document_id)
    ObjectContent.find_by(owner_type: "Document", owner_id: document_id)
  end

  before { ObjectContent.delete_all }

  it "copies the blob out of documents.sync" do
    create_document("mig_one", sync: "yjs-bytes".b)

    backfill

    expect(content_for("mig_one").sync).to eq("yjs-bytes".b)
  end

  # Carried across so recency ordering survives for documents nobody has edited since.
  it "carries the document's timestamps across" do
    was = 3.days.ago.change(usec: 0)
    create_document("mig_ts", sync: "bytes".b, updated_at: was)

    backfill

    expect(content_for("mig_ts").updated_at).to be_within(1.second).of(was)
  end

  it "skips documents with no content" do
    create_document("mig_nil", sync: nil)

    backfill

    expect(content_for("mig_nil")).to be_nil
  end

  # A retried self-hosted boot re-runs this. Without the NOT EXISTS guard the second pass
  # would violate the unique index and abort the upgrade.
  it "is idempotent" do
    create_document("mig_twice", sync: "bytes".b)

    backfill
    expect { backfill }.not_to raise_error

    expect(ObjectContent.where(owner_type: "Document", owner_id: "mig_twice").count).to eq(1)
  end

  it "does not overwrite content written since the first pass" do
    create_document("mig_fresh", sync: "old".b)
    backfill
    content_for("mig_fresh").update!(sync: "newer".b)

    backfill

    expect(content_for("mig_fresh").sync).to eq("newer".b)
  end

  # The batch loop pages by id; a single batch would hide an off-by-one in the cursor.
  it "backfills past one batch" do
    600.times { |i| create_document("mig_batch_#{i.to_s.rjust(4, "0")}", sync: "b#{i}".b) }

    backfill

    expect(ObjectContent.where("owner_id LIKE 'mig_batch_%'").count).to eq(600)
  end
end
