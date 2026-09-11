require "rails_helper"

# The backfill is what the BackfillObjectReferences migration runs, which is the
# only way self-hosted installs get references for content written before the
# reconciler shipped. spec/tasks/object_references_rake_spec.rb covers the rake
# wrapper; this covers the contract the migration depends on.
RSpec.describe ObjectReferenceBackfill do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:user) { users(:pawel) }

  before { ObjectReference.delete_all }

  def unique_id(prefix = "id")
    "#{prefix}_#{SecureRandom.hex(6)}"
  end

  def mention_content(mention_id, entity:, entity_id:)
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
              "title" => "Test"
            }
          }
        ],
        "children" => []
      }
    ]
  end

  # insert! bypasses the after_commit reconciler, standing in for a version saved
  # before that callback existed.
  def unreconciled_version(document, mention_id, entity:, entity_id:, sequential_id: 100)
    Version.insert!({
      document_id: document.id,
      sequential_id: sequential_id,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: entity, entity_id: entity_id),
      created_at: 3.days.ago,
      updated_at: 3.days.ago
    })
  end

  it "builds references for content saved before the reconciler existed" do
    mention_id = unique_id("mention")
    unreconciled_version(documents(:one), mention_id, entity: "user", entity_id: user.id)

    described_class.run

    reference = ObjectReference.find_by(source_node_id: mention_id)
    expect(reference).to be_present
    expect(reference.source_id).to eq(documents(:one).id)
    expect(reference.target_type).to eq("User")
    expect(reference.target_id).to eq(user.id)
  end

  it "is idempotent" do
    unreconciled_version(documents(:one), unique_id("mention"), entity: "document", entity_id: documents(:two).id)

    described_class.run
    after_first = ObjectReference.count

    described_class.run

    expect(after_first).to be_positive
    expect(ObjectReference.count).to eq(after_first)
  end

  it "leaves references the reconciler already wrote alone" do
    mention_id = unique_id("mention")
    documents(:one).versions.create!(
      content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
      created_by: user
    )
    reference = ObjectReference.find_by!(source_node_id: mention_id)

    expect { described_class.run }.not_to change { ObjectReference.count }
    expect(reference.reload.created_at).to eq(reference.created_at)
  end

  it "reports progress, which the migration prints through say" do
    messages = []

    described_class.run { |message| messages << message }

    expect(messages.first).to match(/Backfilling object_references for \d+ documents/)
    expect(messages.last).to match(/Backfill complete: \d+ documents, \d+ tables, \d+ total references/)
  end

  it "runs without a progress block" do
    expect { described_class.run }.not_to raise_error
  end
end
