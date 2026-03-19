require "rails_helper"
require "rake"

RSpec.describe "object_references:backfill" do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:user) { users(:pawel) }

  before(:all) do
    Rails.application.load_tasks
  end

  before(:each) do
    ObjectReference.delete_all
  end

  after(:each) do
    Rake::Task["object_references:backfill"].reenable
  end

  def unique_id(prefix = "id")
    "#{prefix}_#{SecureRandom.hex(6)}"
  end

  def mention_content(mention_id, entity:, entity_id:, title: "Test")
    [
      {
        "id" => unique_id("block"),
        "type" => "paragraph",
        "content" => [
          {
            "type" => "mention",
            "props" => {
              "id" => mention_id,
              "entity" => entity,
              "entityId" => entity_id,
              "title" => title
            }
          }
        ],
        "children" => []
      }
    ]
  end

  it "processes document versions and creates object_references" do
    doc = documents(:one)
    mention_id = unique_id("mention")
    Version.insert!({
      document_id: doc.id,
      sequential_id: 100,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
      created_at: 3.days.ago,
      updated_at: 3.days.ago
    })

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(source_node_id: mention_id)
    expect(ref).to be_present
    expect(ref.source_id).to eq(doc.id)
    expect(ref.target_type).to eq("User")
  end

  it "is idempotent — running twice produces same result" do
    doc = documents(:one)
    mention_id = unique_id("mention")
    Version.insert!({
      document_id: doc.id,
      sequential_id: 100,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: "document", entity_id: documents(:two).id),
      created_at: 3.days.ago,
      updated_at: 3.days.ago
    })

    Rake::Task["object_references:backfill"].invoke
    count_after_first = ObjectReference.count

    Rake::Task["object_references:backfill"].reenable
    Rake::Task["object_references:backfill"].invoke
    expect(ObjectReference.count).to eq(count_after_first)
  end

  it "sets created_at to version.created_at, not current time" do
    doc = documents(:one)
    mention_id = unique_id("mention")
    old_time = 10.days.ago.change(usec: 0)
    Version.insert!({
      document_id: doc.id,
      sequential_id: 100,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
      created_at: old_time,
      updated_at: old_time
    })

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(source_node_id: mention_id)
    expect(ref.created_at).to eq(old_time)
  end

  it "handles documents with no versions" do
    expect {
      Rake::Task["object_references:backfill"].invoke
    }.not_to raise_error
  end

  it "handles missing targets (broken references)" do
    doc = documents(:one)
    mention_id = unique_id("mention")
    Version.insert!({
      document_id: doc.id,
      sequential_id: 100,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: "document", entity_id: "nonexistent"),
      created_at: Time.current,
      updated_at: Time.current
    })

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(source_node_id: mention_id)
    expect(ref).to be_broken
  end

  it "respects BATCH_SIZE env var" do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("BATCH_SIZE", 100).and_return(1)

    expect {
      Rake::Task["object_references:backfill"].invoke
    }.not_to raise_error
  end

  it "processes comments on documents" do
    doc = documents(:one)
    org_membership = organization_memberships(:om_is_pawel)
    mention_id = unique_id("mention")

    # Create comment (callback will create refs, but we delete them to test backfill)
    comment = ObjectComment.create!(
      object: doc,
      organization: organization,
      organization_membership: org_membership,
      content: mention_content(mention_id, entity: "user", entity_id: user.id)
    )
    ObjectReference.delete_all

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(source_node_id: mention_id)
    expect(ref).to be_present
    expect(ref.source_comment_id).to eq(comment.id)
  end
end
