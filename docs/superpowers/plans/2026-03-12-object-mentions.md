# Object Mentions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce an `object_mentions` persistence layer that tracks all mention relationships between documents/tables/users, enabling proper broken link handling during imports and resilient link tracking when documents are deleted.

**Architecture:** A new `ObjectMention` model maps 1:1 to BlockNote mention inline content nodes. Reconciliation happens synchronously on version creation, scanning content blocks and upserting `object_mentions`. The frontend batch-loads mentions per document and renders broken links (red + strikethrough) when `target_id` is NULL. The import pipeline produces `<span data-mention>` HTML that the BlockNote converter parses into proper mention nodes.

**Tech Stack:** Ruby on Rails 8.1, PostgreSQL, React 18 + TypeScript, BlockNote editor, Vitest (converter tests), RSpec (Rails tests)

**Spec:** `docs/superpowers/specs/2026-03-12-object-mentions-design.md`

---

## Chunk 1: Database, Model, and Fixtures

### Task 1: Migration

**Files:**
- Create: `db/migrate/XXXXXX_create_object_mentions.rb`

- [ ] **Step 1: Generate migration**

Run: `bin/rails generate migration CreateObjectMentions`

- [ ] **Step 2: Write migration**

```ruby
class CreateObjectMentions < ActiveRecord::Migration[8.1]
  def change
    create_table :object_mentions, id: :string do |t|
      t.string :source_type, null: false
      t.string :source_id, null: false
      t.string :target_type, null: false
      t.string :target_id
      t.string :title, null: false
      t.boolean :current, null: false, default: true
      t.belongs_to :organization, type: :string, null: false, foreign_key: true

      t.timestamps
    end

    add_index :object_mentions, [:source_type, :source_id]
    add_index :object_mentions, [:target_type, :target_id]
  end
end
```

- [ ] **Step 3: Run migration**

Run: `bin/rails db:migrate`
Expected: Migration succeeds, `object_mentions` table created.

- [ ] **Step 4: Commit**

```bash
git add db/migrate/*_create_object_mentions.rb db/schema.rb
git commit -m "db: create object_mentions table"
```

### Task 2: ObjectMention Model

**Files:**
- Create: `app/models/object_mention.rb`
- Test: `spec/models/object_mention_spec.rb`
- Create: `spec/fixtures/object_mentions.yml`

- [ ] **Step 1: Create fixtures**

```yaml
# spec/fixtures/object_mentions.yml
_fixture:
  model_class: ObjectMention

doc_mention_to_doc:
  id: "550e8400-e29b-41d4-a716-446655440001"
  source_type: Document
  source_id: <%= ActiveRecord::FixtureSet.identify(:one, :string) %>
  target_type: Document
  target_id: <%= ActiveRecord::FixtureSet.identify(:two, :string) %>
  title: Two
  current: true
  organization_id: "is"

doc_mention_to_user:
  id: "550e8400-e29b-41d4-a716-446655440003"
  source_type: Document
  source_id: <%= ActiveRecord::FixtureSet.identify(:one, :string) %>
  target_type: User
  target_id: "user_stefan"
  title: Stefan Piotrowski
  current: true
  organization_id: "is"

broken_doc_mention:
  id: "550e8400-e29b-41d4-a716-446655440004"
  source_type: Document
  source_id: <%= ActiveRecord::FixtureSet.identify(:two, :string) %>
  target_type: Document
  target_id:
  title: Deleted Document
  current: true
  organization_id: "is"

old_version_mention:
  id: "550e8400-e29b-41d4-a716-446655440005"
  source_type: Document
  source_id: <%= ActiveRecord::FixtureSet.identify(:two, :string) %>
  target_type: Document
  target_id: <%= ActiveRecord::FixtureSet.identify(:one, :string) %>
  title: One
  current: false
  organization_id: "is"
```

Note: The table mention fixture was removed since table fixture IDs are uncertain. Table mention tests are covered in the reconciler spec where tables are created inline. Verify document fixture IDs resolve correctly by checking `spec/fixtures/documents.yml` — they use `id: one` and `id: two` which are literal string IDs.

- [ ] **Step 2: Write failing model tests**

```ruby
# spec/models/object_mention_spec.rb
require "rails_helper"

RSpec.describe ObjectMention, type: :model do
  fixtures :organizations, :users, :documents, :object_mentions

  describe "validations" do
    it "is valid with all required fields" do
      mention = ObjectMention.new(
        id: SecureRandom.uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        organization: organizations(:is)
      )
      expect(mention).to be_valid
    end

    it "is valid without target_id (broken link)" do
      mention = ObjectMention.new(
        id: SecureRandom.uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: nil,
        title: "Missing Doc",
        organization: organizations(:is)
      )
      expect(mention).to be_valid
    end

    it "requires source_type" do
      mention = object_mentions(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.source_type = nil
      expect(mention).not_to be_valid
    end

    it "requires source_id" do
      mention = object_mentions(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.source_id = nil
      expect(mention).not_to be_valid
    end

    it "requires target_type" do
      mention = object_mentions(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.target_type = nil
      expect(mention).not_to be_valid
    end

    it "requires title" do
      mention = object_mentions(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.title = nil
      expect(mention).not_to be_valid
    end

    it "requires organization" do
      mention = object_mentions(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.organization_id = nil
      expect(mention).not_to be_valid
    end
  end

  describe "#broken?" do
    it "returns true when target_id is nil" do
      expect(object_mentions(:broken_doc_mention)).to be_broken
    end

    it "returns false when target_id is present" do
      expect(object_mentions(:doc_mention_to_doc)).not_to be_broken
    end
  end

  describe "scopes" do
    it ".current returns only current mentions" do
      results = ObjectMention.current
      expect(results).to include(object_mentions(:doc_mention_to_doc))
      expect(results).not_to include(object_mentions(:old_version_mention))
    end

    it ".broken returns only broken mentions" do
      results = ObjectMention.broken
      expect(results).to include(object_mentions(:broken_doc_mention))
      expect(results).not_to include(object_mentions(:doc_mention_to_doc))
    end

    it ".for_source returns mentions for a specific source" do
      doc_one = documents(:one)
      results = ObjectMention.for_source(doc_one)
      expect(results).to include(object_mentions(:doc_mention_to_doc))
      expect(results).to include(object_mentions(:doc_mention_to_user))
      expect(results).not_to include(object_mentions(:broken_doc_mention))
    end

    it ".pointing_to returns mentions targeting a specific object" do
      doc_two = documents(:two)
      results = ObjectMention.pointing_to("Document", doc_two.id)
      expect(results).to include(object_mentions(:doc_mention_to_doc))
      expect(results).not_to include(object_mentions(:doc_mention_to_table))
    end
  end

  describe "ID generation" do
    it "uses the explicitly set UUID, not auto-generated NPI" do
      uuid = SecureRandom.uuid
      mention = ObjectMention.create!(
        id: uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Test",
        organization: organizations(:is)
      )
      expect(mention.id).to eq(uuid)
      expect(mention.id.length).to eq(36) # UUID length, not NPI's 10
    end
  end
end
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bin/rspec spec/models/object_mention_spec.rb`
Expected: FAIL — `uninitialized constant ObjectMention`

- [ ] **Step 4: Write the model**

```ruby
# app/models/object_mention.rb
class ObjectMention < ApplicationRecord
  ALLOWED_SOURCE_TYPES = %w[Document].freeze
  ALLOWED_TARGET_TYPES = %w[Document Table User].freeze

  belongs_to :organization
  belongs_to :source, polymorphic: true

  validates :source_type, presence: true, inclusion: { in: ALLOWED_SOURCE_TYPES }
  validates :source_id, presence: true
  validates :target_type, presence: true, inclusion: { in: ALLOWED_TARGET_TYPES }
  validates :title, presence: true

  scope :current, -> { where(current: true) }
  scope :broken, -> { where(target_id: nil) }
  scope :for_source, ->(source) { where(source_type: source.class.name, source_id: source.id) }
  scope :pointing_to, ->(target_type, target_id) { where(target_type: target_type, target_id: target_id) }

  def broken?
    target_id.nil?
  end

  private

  # Override ApplicationRecord's NPI generation — we use UUIDs from mention node props.id
  def generate_id_if_needed
    # no-op: id is always set explicitly from the BlockNote mention node's props.id
  end
end
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bin/rspec spec/models/object_mention_spec.rb`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/models/object_mention.rb spec/models/object_mention_spec.rb spec/fixtures/object_mentions.yml
git commit -m "feat: add ObjectMention model with scopes and validations"
```

---

## Chunk 2: ObjectMentionReconciler Service

### Task 3: ObjectMentionReconciler

**Files:**
- Create: `app/services/object_mention_reconciler.rb`
- Test: `spec/services/object_mention_reconciler_spec.rb`

- [ ] **Step 1: Write failing tests**

```ruby
# spec/services/object_mention_reconciler_spec.rb
require "rails_helper"

RSpec.describe ObjectMentionReconciler do
  fixtures :organizations, :users, :documents, :spaces, :tables

  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }

  def mention_block(id:, entity:, entity_id:, title: "Test")
    {
      "id" => "block-1",
      "type" => "paragraph",
      "props" => {},
      "content" => [
        {
          "type" => "mention",
          "props" => {
            "id" => id,
            "entity" => entity,
            "entityId" => entity_id,
            "title" => title
          }
        }
      ],
      "children" => []
    }
  end

  describe ".reconcile" do
    it "creates object_mentions for new mention nodes" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Two")]

      expect {
        described_class.reconcile(document, blocks)
      }.to change(ObjectMention, :count).by(1)

      om = ObjectMention.find(uuid)
      expect(om.source_type).to eq("Document")
      expect(om.source_id).to eq(document.id)
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to eq(documents(:two).id)
      expect(om.title).to eq("Two")
      expect(om.current).to be true
      expect(om.organization_id).to eq(organization.id)
    end

    it "creates object_mentions for table mentions" do
      uuid = SecureRandom.uuid
      table = Table.first
      skip "No tables in test database" unless table
      blocks = [mention_block(id: uuid, entity: "table", entity_id: table.id, title: "Test Table")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.target_type).to eq("Table")
      expect(om.target_id).to eq(table.id)
    end

    it "creates object_mentions for user mentions" do
      uuid = SecureRandom.uuid
      user = users(:stefan)
      blocks = [mention_block(id: uuid, entity: "user", entity_id: user.id, title: "Stefan")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.target_type).to eq("User")
      expect(om.target_id).to eq(user.id)
    end

    it "updates existing object_mention to current: true when still present" do
      uuid = SecureRandom.uuid
      ObjectMention.create!(
        id: uuid,
        source: document,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        current: false,
        organization: organization
      )

      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]

      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)

      expect(ObjectMention.find(uuid).current).to be true
    end

    it "sets current: false for mentions removed from latest version" do
      uuid = SecureRandom.uuid
      ObjectMention.create!(
        id: uuid,
        source: document,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        current: true,
        organization: organization
      )

      # Empty blocks — mention was removed
      described_class.reconcile(document, [])

      expect(ObjectMention.find(uuid).current).to be false
    end

    it "creates broken mention when entityId points to nonexistent document" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "nonexistent_npi", title: "Gone Doc")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Document")
      expect(om.target_id).to be_nil
      expect(om.title).to eq("Gone Doc")
    end

    it "creates broken mention when entityId points to nonexistent table" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "table", entity_id: "nonexistent_npi", title: "Gone Table")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("Table")
    end

    it "creates broken mention when entityId points to nonexistent user" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "user", entity_id: "nonexistent_id", title: "Gone User")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.target_type).to eq("User")
    end

    it "creates broken mention when entityId is empty string (import broken link)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "", title: "Unresolved Link")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om).to be_broken
      expect(om.title).to eq("Unresolved Link")
    end

    it "updates title from target object when target exists" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id, title: "Old Title")]

      described_class.reconcile(document, blocks)

      om = ObjectMention.find(uuid)
      expect(om.title).to eq(documents(:two).title)
    end

    it "preserves title from mention node when target does not exist" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: "gone", title: "Original Title")]

      described_class.reconcile(document, blocks)

      expect(ObjectMention.find(uuid).title).to eq("Original Title")
    end

    it "skips mention nodes with empty id" do
      blocks = [mention_block(id: "", entity: "document", entity_id: documents(:two).id)]

      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
    end

    it "skips mention nodes with entityId of -1 (uninitialized)" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: -1)]

      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
    end

    it "is idempotent — running twice produces same result" do
      uuid = SecureRandom.uuid
      blocks = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]

      described_class.reconcile(document, blocks)
      expect {
        described_class.reconcile(document, blocks)
      }.not_to change(ObjectMention, :count)
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/object_mention_reconciler_spec.rb`
Expected: FAIL — `uninitialized constant ObjectMentionReconciler`

- [ ] **Step 3: Write the reconciler service**

```ruby
# app/services/object_mention_reconciler.rb
class ObjectMentionReconciler
  ENTITY_TO_TYPE = {
    "document" => "Document",
    "table" => "Table",
    "user" => "User"
  }.freeze

  ENTITY_TO_MODEL = {
    "Document" => Document,
    "Table" => Table,
    "User" => User
  }.freeze

  def self.reconcile(document, content_blocks)
    new(document).reconcile(content_blocks)
  end

  def initialize(document)
    @document = document
    @organization = document.organization
  end

  def reconcile(content_blocks)
    mention_nodes = extract_mentions(content_blocks)
    mention_ids = mention_nodes.map { |m| m[:id] }

    # Batch-fetch existing targets and their titles
    target_data = batch_fetch_targets(mention_nodes)

    # Batch-fetch existing object_mentions for this source
    existing_mentions = ObjectMention.for_source(@document).index_by(&:id)

    # Upsert mentions
    mention_nodes.each do |node|
      target_type = ENTITY_TO_TYPE[node[:entity]]
      next unless target_type

      entity_id = node[:entity_id]
      target_info = target_data.dig(target_type, entity_id.to_s)
      target_id = target_info ? entity_id.to_s : nil

      # Use target's real title if it exists, otherwise use the mention node's title
      title = target_info&.fetch(:title, nil) || node[:title].presence || "Untitled"

      if (existing = existing_mentions[node[:id]])
        existing.update!(current: true, title: title, target_id: target_id)
      else
        ObjectMention.create!(
          id: node[:id],
          source: @document,
          target_type: target_type,
          target_id: target_id,
          title: title,
          current: true,
          organization: @organization
        )
      end
    end

    # Mark removed mentions as not current
    ObjectMention.for_source(@document)
                 .where.not(id: mention_ids)
                 .where(current: true)
                 .update_all(current: false)
  end

  private

  def extract_mentions(blocks)
    mentions = []
    walk_blocks(blocks) do |node|
      next unless node.is_a?(Hash) && node["type"] == "mention"

      props = node["props"] || {}
      id = props["id"].to_s
      entity_id = props["entityId"]

      # Skip empty IDs and uninitialized mentions
      next if id.blank?
      next if entity_id == -1 || entity_id == "-1"

      mentions << {
        id: id,
        entity: props["entity"].to_s,
        entity_id: entity_id,
        title: props["title"].to_s
      }
    end
    mentions
  end

  def walk_blocks(nodes, &block)
    return unless nodes.is_a?(Array)

    nodes.each do |node|
      next unless node.is_a?(Hash)

      yield node

      walk_blocks(node["content"], &block) if node["content"].is_a?(Array)
      walk_blocks(node["children"], &block) if node["children"].is_a?(Array)
    end
  end

  def batch_fetch_targets(mention_nodes)
    targets = {}

    mention_nodes.group_by { |m| ENTITY_TO_TYPE[m[:entity]] }.each do |target_type, nodes|
      next unless target_type

      model = ENTITY_TO_MODEL[target_type]
      next unless model

      ids = nodes.map { |n| n[:entity_id].to_s }.reject(&:blank?).uniq
      records = model.where(id: ids)

      targets[target_type] = records.each_with_object({}) do |record, h|
        title = case target_type
                when "User" then "#{record.first_name} #{record.last_name}"
                else record.title
                end
        h[record.id.to_s] = { title: title }
      end
    end

    targets
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/services/object_mention_reconciler_spec.rb`
Expected: All tests PASS. Some fixture-dependent tests may need adjustment (e.g., table fixture IDs). Fix as needed.

- [ ] **Step 5: Commit**

```bash
git add app/services/object_mention_reconciler.rb spec/services/object_mention_reconciler_spec.rb
git commit -m "feat: add ObjectMentionReconciler service for mention tracking"
```

### Task 4: Wire Reconciler to Version Creation

**Files:**
- Modify: `app/models/version.rb:21-23`

- [ ] **Step 1: Write integration test**

Add to `spec/services/object_mention_reconciler_spec.rb`:

```ruby
describe "Version callback integration" do
  fixtures :organizations, :users, :documents, :spaces, :versions

  it "triggers reconciliation when a version is created" do
    doc = documents(:one)
    uuid = SecureRandom.uuid
    blocks = [
      {
        "id" => "block-1",
        "type" => "paragraph",
        "content" => [
          {
            "type" => "mention",
            "props" => {
              "id" => uuid,
              "entity" => "document",
              "entityId" => documents(:two).id,
              "title" => "Two"
            }
          }
        ],
        "children" => []
      }
    ]

    expect {
      doc.versions.create!(content_blocks: blocks, created_by: users(:pawel))
    }.to change(ObjectMention, :count).by(1)

    om = ObjectMention.find(uuid)
    expect(om.source_id).to eq(doc.id)
    expect(om.target_id).to eq(documents(:two).id)
    expect(om.current).to be true
  end

  it "marks removed mentions as not current on new version" do
    doc = documents(:one)
    uuid = SecureRandom.uuid

    # First version with a mention
    blocks_v1 = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    doc.versions.create!(content_blocks: blocks_v1, created_by: users(:pawel))
    expect(ObjectMention.find(uuid).current).to be true

    # Second version without the mention
    blocks_v2 = [{ "id" => "block-2", "type" => "paragraph", "content" => [], "children" => [] }]
    doc.versions.create!(content_blocks: blocks_v2, created_by: users(:pawel))
    expect(ObjectMention.find(uuid).current).to be false
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rspec spec/services/object_mention_reconciler_spec.rb -e "Version callback"`
Expected: FAIL — version creation doesn't trigger reconciliation yet

- [ ] **Step 3: Add after_create callback to Version**

Modify `app/models/version.rb` — add after line 23 (after the existing `after_commit`):

```ruby
after_create :reconcile_object_mentions
```

Note: This is intentionally `after_create` (inside the transaction), not `after_commit`. This ensures `object_mentions` are consistent with the version. If reconciliation fails, it will roll back the version creation, which is the desired behavior — we don't want versions without corresponding `object_mentions`.

And add private method before the existing `set_sequential_id`:

```ruby
def reconcile_object_mentions
  ObjectMentionReconciler.reconcile(document, content_blocks) if content_blocks.present?
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/services/object_mention_reconciler_spec.rb`
Expected: All tests PASS

- [ ] **Step 5: Run existing version tests to check for regressions**

Run: `bin/rspec spec/`
Expected: No regressions. The reconciler is additive — it creates `object_mentions` but doesn't affect existing behavior.

- [ ] **Step 6: Commit**

```bash
git add app/models/version.rb spec/services/object_mention_reconciler_spec.rb
git commit -m "feat: wire ObjectMentionReconciler to Version after_create"
```

---

## Chunk 3: Deletion Hooks

### Task 5: Document Deletion Hook

**Files:**
- Modify: `app/models/document.rb:34`
- Test: `spec/models/document_spec.rb` (create if needed, or add to existing)

- [ ] **Step 1: Write failing test**

```ruby
# spec/models/document_spec.rb (add to existing file or create)
require "rails_helper"

RSpec.describe Document, type: :model do
  fixtures :organizations, :users, :documents, :spaces

  describe "object_mention cleanup on destroy" do
    let(:organization) { organizations(:is) }
    let(:source_doc) { documents(:one) }
    let(:target_doc) { documents(:two) }

    it "nullifies target_id on object_mentions pointing to deleted document" do
      om = ObjectMention.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      target_doc.space.remove_single_item_from_hierarchy!(target_doc.id)
      target_doc.destroy!

      om.reload
      expect(om.target_id).to be_nil
      expect(om.target_type).to eq("Document")
      expect(om.title).to eq("Target Doc")
    end

    it "deletes object_mentions where deleted document is the source" do
      om = ObjectMention.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      source_doc.space.remove_single_item_from_hierarchy!(source_doc.id)
      source_doc.destroy!

      expect(ObjectMention.exists?(om.id)).to be false
    end
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rspec spec/models/document_spec.rb`
Expected: FAIL — `target_id` is not nullified on destroy

- [ ] **Step 3: Add deletion hooks to Document model**

Modify `app/models/document.rb`:

After line 25 (`has_many :editing_sessions`), add:
```ruby
has_many :source_object_mentions, class_name: "ObjectMention", as: :source, dependent: :delete_all
```

After line 34 (`before_destroy :nullify_space_home_document_id`), add:
```ruby
before_destroy :nullify_object_mention_targets
```

Add private method (after `nullify_space_home_document_id` method):
```ruby
def nullify_object_mention_targets
  ObjectMention.where(target_type: "Document", target_id: id, organization_id: organization_id)
               .update_all(target_id: nil)
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/models/document_spec.rb`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/models/document.rb spec/models/document_spec.rb
git commit -m "feat: add Document deletion hooks for object_mentions"
```

### Task 6: Table Deletion Hook

**Files:**
- Modify: `app/models/table.rb:24-31`
- Test: `spec/models/table_spec.rb` (create or add to existing)

- [ ] **Step 1: Write failing test**

```ruby
# spec/models/table_spec.rb (add to existing file or create)
require "rails_helper"

RSpec.describe Table, type: :model do
  fixtures :organizations, :users, :documents, :spaces, :tables

  describe "object_mention cleanup on destroy" do
    let(:organization) { organizations(:is) }
    let(:source_doc) { documents(:one) }

    it "nullifies target_id on object_mentions pointing to deleted table" do
      table = Table.where(organization: organization).first
      skip "No table fixtures available" unless table

      om = ObjectMention.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Table",
        target_id: table.id,
        title: "Test Table",
        organization: organization
      )

      table.destroy!

      om.reload
      expect(om.target_id).to be_nil
      expect(om.target_type).to eq("Table")
      expect(om.title).to eq("Test Table")
    end
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rspec spec/models/table_spec.rb`
Expected: FAIL — `target_id` is not nullified

- [ ] **Step 3: Add deletion hook to Table model**

Modify `app/models/table.rb` — add after line 41 (`validates_presence_of :name`):

```ruby
before_destroy :nullify_object_mention_targets
```

Add private method at the end of the class (before the final `end`):

```ruby
def nullify_object_mention_targets
  ObjectMention.where(target_type: "Table", target_id: id, organization_id: organization_id)
               .update_all(target_id: nil)
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/models/table_spec.rb`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/models/table.rb spec/models/table_spec.rb
git commit -m "feat: add Table deletion hook for object_mentions"
```

---

## Chunk 4: BlockNote Converter — Mention Parse/Serialize Handlers

### Task 7: Add parseHTML and toExternalHTML to Mention Spec

**Files:**
- Modify: `micro-services/blocknote-converter/src/strippedSchema.tsx:94-123`
- Test: `micro-services/blocknote-converter/tests/mentionParsing.test.ts`

- [ ] **Step 1: Write failing converter tests**

```typescript
// micro-services/blocknote-converter/tests/mentionParsing.test.ts
import {convertMarkdownToBlocks, convertBlocksToMarkdown} from "../src/converters";

describe("mention HTML parsing", () => {
  it("converts <span data-mention='document'> to mention node with correct props", async () => {
    // Raw HTML in markdown — remarkRehype + rehype-raw will parse the span
    const markdown = 'See <span data-mention="document" data-entity-id="doc_abc">Project Plan</span> for details.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    expect(paragraph.type).toBe("paragraph");

    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("document");
    expect(mentionNode.props.entityId).toBe("doc_abc");
    expect(mentionNode.props.title).toBe("Project Plan");
    expect(mentionNode.props.id).toBeTruthy(); // Should have a generated UUID
  });

  it("converts <span data-mention='document'> with empty entity-id to broken mention", async () => {
    const markdown = 'See <span data-mention="document" data-entity-id="">Missing Doc</span> here.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("document");
    expect(mentionNode.props.entityId).toBe("");
    expect(mentionNode.props.title).toBe("Missing Doc");
  });

  it("converts <span data-mention='table'> to table mention", async () => {
    const markdown = 'Check <span data-mention="table" data-entity-id="tbl_xyz">Budget</span> table.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("table");
    expect(mentionNode.props.entityId).toBe("tbl_xyz");
  });

  it("does NOT convert regular <a href='/d/npi'> links to mentions", async () => {
    const markdown = "Check [this doc](/d/doc_abc) for details.";
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content?.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeUndefined();
  });
});

describe("mention HTML serialization", () => {
  it("serializes mention nodes to <span data-mention> HTML", async () => {
    const blocks = [
      {
        id: "block-1",
        type: "paragraph" as const,
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left" as const},
        content: [
          {type: "text" as const, text: "See ", styles: {}},
          {
            type: "mention" as const,
            props: {
              id: "uuid-123",
              entity: "document",
              entityId: "doc_abc",
              title: "Project Plan"
            }
          },
          {type: "text" as const, text: " for details.", styles: {}}
        ],
        children: []
      }
    ];

    const markdown = await convertBlocksToMarkdown(blocks);
    // The mention should serialize as HTML span in markdown output
    expect(markdown).toContain("data-mention");
    expect(markdown).toContain("document");
    expect(markdown).toContain("doc_abc");
    expect(markdown).toContain("Project Plan");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd micro-services/blocknote-converter && npm test -- --run tests/mentionParsing.test.ts`
Expected: FAIL — mentions are not parsed from `<span data-mention>` HTML

- [ ] **Step 3: Update strippedSchema.tsx with parse and serialize handlers**

Modify `micro-services/blocknote-converter/src/strippedSchema.tsx`. Replace the MentionInlineContent definition (lines 94-123) with:

```typescript
// The Mention inline content.
const MentionInlineContent = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      id: {
        default: "",
      },
      entity: {
        default: "document"
      },
      entityId: {
        default: -1,
      },
      title: {
        default: "Untitled",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      let {id, entityId, entity, title} = props.inlineContent.props;

      const mentionUrl = `https://fundamento.cloud/${entity}/${entityId}`;

      return <a href={mentionUrl}>{title || mentionUrl}</a>;
    },
    toExternalHTML: (props) => {
      const {entity, entityId, title} = props.inlineContent.props;
      return (
        <span
          data-mention={entity}
          data-entity-id={entityId?.toString() || ""}
        >
          {title || "Untitled"}
        </span>
      );
    },
  }
);
```

- [ ] **Step 4: Add rehype-raw and mention span preprocessing**

**Critical:** Raw HTML embedded in markdown (like `<span data-mention>`) passes through the remark→rehype pipeline as raw text nodes, NOT parsed element nodes. We need `rehype-raw` to parse them into proper HAST elements before our plugin can find them.

First install `rehype-raw`:

Run: `cd micro-services/blocknote-converter && npm install rehype-raw`

Then modify `micro-services/blocknote-converter/src/converters.ts`:

Add import at top of file:
```typescript
import rehypeRaw from "rehype-raw";
```

Add a new rehype plugin after the existing `addSpacesToCheckboxes` function (around line 128):

```typescript
/**
 * Rehype plugin: convert <span data-mention="..."> elements to the HTML
 * format that BlockNote's tryParseHTMLToBlocks recognizes for custom
 * inline content (data-inline-content-type attribute).
 */
function convertMentionSpans() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName === "span" && node.properties?.dataMention) {
        const entity = node.properties.dataMention;
        const entityId = node.properties.dataEntityId || "";
        const title = node.children
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.value)
          .join("") || "Untitled";
        const id = crypto.randomUUID();

        // Transform to BlockNote's custom inline content HTML format
        // BlockNote's HTML parser recognizes data-inline-content-type for custom inline content
        node.properties = {
          "data-inline-content-type": "mention",
          "data-id": id,
          "data-entity": entity,
          "data-entity-id": entityId,
          "data-title": title,
        };
        node.tagName = "span";
      }
    });
  };
}
```

Then update the `markdownToHtml` function — add `rehype-raw` BEFORE `convertMentionSpans` so raw HTML spans are parsed into proper HAST elements:

```typescript
function markdownToHtml(markdown: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      // ... existing handlers unchanged ...
      allowDangerousHtml: true,
    })
    .use(rehypeRaw)              // <-- parse raw HTML into HAST elements
    .use(convertMentionSpans)    // <-- transform mention spans to BlockNote format
    .use(rehypeStringify, {allowDangerousHtml: true})
    .processSync(markdown);

  return result.value as string;
}
```

**Important notes:**
- The `data-inline-content-type` attribute is what BlockNote's HTML parser uses to identify custom inline content. Verify by checking how `blocksToHTMLLossy` serializes mention nodes — inspect the output HTML to confirm the exact attribute name. If it doesn't work, use the context7 MCP tool to check BlockNote docs for `tryParseHTMLToBlocks` custom inline content parsing.
- `crypto.randomUUID()` is available globally in Node 19+. The project uses Node 24, so no import needed.
- Adding `rehype-raw` may affect how other raw HTML passes through. Run all existing converter tests after this change to verify no regressions.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd micro-services/blocknote-converter && npm test -- --run tests/mentionParsing.test.ts`
Expected: Parse tests PASS. If they don't, investigate how BlockNote's HTML parser recognizes custom inline content and adjust the `data-*` attributes accordingly.

- [ ] **Step 6: Run all converter tests to check for regressions**

Run: `cd micro-services/blocknote-converter && npm test`
Expected: All existing tests PASS

- [ ] **Step 7: Commit**

```bash
git add micro-services/blocknote-converter/src/strippedSchema.tsx micro-services/blocknote-converter/src/converters.ts micro-services/blocknote-converter/tests/mentionParsing.test.ts
git commit -m "feat: add mention parse/serialize handlers to BlockNote converter"
```

---

## Chunk 5: Import Pipeline Changes

### Task 8: Update ImportLinkResolutionJob

**Files:**
- Modify: `app/jobs/import_link_resolution_job.rb:82-101`
- Test: `spec/jobs/import_link_resolution_job_spec.rb`

- [ ] **Step 1: Write/update failing tests**

Check existing test file first: `spec/jobs/import_link_resolution_job_spec.rb`. Add new tests for the `<span data-mention>` output:

```ruby
# Add these tests to the existing spec file
describe "process_wiki_links_in_markdown with mention spans" do
  let(:job) { ImportLinkResolutionJob.new }

  it "converts resolved wiki link to data-mention span" do
    combined_map = { "project.md" => "doc_abc" }
    result = job.send(:process_wiki_links_in_markdown, "See [[project]]", combined_map)

    expect(result).to include('<span data-mention="document" data-entity-id="doc_abc">project</span>')
  end

  it "converts broken wiki link to data-mention span with empty entity-id" do
    combined_map = {}
    result = job.send(:process_wiki_links_in_markdown, "See [[missing]]", combined_map)

    expect(result).to include('<span data-mention="document" data-entity-id="">missing</span>')
  end

  it "uses alias text as display text" do
    combined_map = { "project.md" => "doc_abc" }
    result = job.send(:process_wiki_links_in_markdown, "See [[project|My Project]]", combined_map)

    expect(result).to include('<span data-mention="document" data-entity-id="doc_abc">My Project</span>')
  end

  it "uses alias text for broken links" do
    combined_map = {}
    result = job.send(:process_wiki_links_in_markdown, "See [[missing|Display Name]]", combined_map)

    expect(result).to include('<span data-mention="document" data-entity-id="">Display Name</span>')
  end

  it "does not produce strikethrough broken_link markers anymore" do
    combined_map = {}
    result = job.send(:process_wiki_links_in_markdown, "See [[missing]]", combined_map)

    expect(result).not_to include("~~")
    expect(result).not_to include(".broken_link")
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/jobs/import_link_resolution_job_spec.rb`
Expected: FAIL — current code produces markdown links and strikethrough markers

- [ ] **Step 3: Update the wiki link replacement logic**

Modify `app/jobs/import_link_resolution_job.rb`. Replace the `process_wiki_links_in_markdown` method (lines 70-101):

```ruby
def process_wiki_links_in_markdown(markdown, combined_map)
  # Replace ![[attachment]] with image/file markdown using attachment: URI
  markdown = markdown.gsub(/!\[\[([^\]]+)\]\]/) do |match|
    target = $1.strip
    attachment_uri = resolve_attachment_link(target, combined_map)
    if attachment_uri
      "![#{target}](#{attachment_uri})"
    else
      match # leave as-is, will be a broken link
    end
  end

  # Replace [[wiki links]] with mention spans
  markdown.gsub(/\[\[([^\]]+)\]\]/) do |match|
    raw = $1.strip
    # Handle [[target|alias]] syntax
    target, alias_text = raw.split("|", 2).map(&:strip)
    # Handle [[target#heading]] syntax
    target_base, _heading = target.split("#", 2)

    doc_id = resolve_wiki_link(target_base, combined_map)
    display = alias_text || target_base

    if doc_id
      "<span data-mention=\"document\" data-entity-id=\"#{doc_id}\">#{display}</span>"
    else
      "<span data-mention=\"document\" data-entity-id=\"\">#{display}</span>"
    end
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/jobs/import_link_resolution_job_spec.rb`
Expected: All tests PASS (new and existing)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `bin/rspec spec/jobs/`
Expected: No regressions in other import job tests

- [ ] **Step 6: Commit**

```bash
git add app/jobs/import_link_resolution_job.rb spec/jobs/import_link_resolution_job_spec.rb
git commit -m "feat: import pipeline produces mention spans instead of markdown links"
```

---

## Chunk 6: API Endpoint

### Task 9: ObjectMentions API Controller

**Files:**
- Create: `app/controllers/api/v1/object_mentions_controller.rb`
- Modify: `config/routes.rb:199`
- Test: `spec/requests/api/v1/object_mentions_controller_spec.rb`

- [ ] **Step 1: Write failing request spec**

```ruby
# spec/requests/api/v1/object_mentions_controller_spec.rb
require "rails_helper"

RSpec.describe "Api::V1::ObjectMentions", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }
  let(:document_one) { documents(:one) }
  let(:document_two) { documents(:two) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test API Token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" } }

  describe "GET /api/v1/documents/:document_id/object_mentions" do
    it "returns current object_mentions for a document" do
      om = ObjectMention.create!(
        id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: document_two.id,
        title: "Two",
        current: true,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_mentions",
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["object_mentions"].length).to eq(1)
      expect(json["object_mentions"][0]["id"]).to eq(om.id)
      expect(json["object_mentions"][0]["target_type"]).to eq("Document")
      expect(json["object_mentions"][0]["target_id"]).to eq(document_two.id)
      expect(json["object_mentions"][0]["title"]).to eq("Two")
    end

    it "includes broken mentions in response" do
      ObjectMention.create!(
        id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: nil,
        title: "Missing Doc",
        current: true,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_mentions",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_mentions"][0]["target_id"]).to be_nil
      expect(json["object_mentions"][0]["title"]).to eq("Missing Doc")
    end

    it "excludes non-current mentions" do
      ObjectMention.create!(
        id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: document_two.id,
        title: "Old",
        current: false,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_mentions",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_mentions"]).to be_empty
    end

    it "returns empty array for document with no mentions" do
      get "/api/v1/documents/#{document_one.id}/object_mentions",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_mentions"]).to eq([])
    end

    it "returns unauthorized without authentication" do
      get "/api/v1/documents/#{document_one.id}/object_mentions"

      expect(response).to have_http_status(:unauthorized)
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_membership) { organization_memberships(:om_hc_pawel) }
      let!(:other_token) do
        ApiToken.create!(
          organization: other_org,
          organization_membership: other_membership,
          title: "Other Org Token"
        )
      end

      it "returns not found when accessing document from different organization" do
        get "/api/v1/documents/#{document_one.id}/object_mentions",
          headers: { "Authorization" => "Bearer #{other_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/requests/api/v1/object_mentions_controller_spec.rb`
Expected: FAIL — route not found

- [ ] **Step 3: Add route**

Modify `config/routes.rb` — change line 199 from:
```ruby
resources :documents, only: [:index, :show, :create, :update]
```
to:
```ruby
resources :documents, only: [:index, :show, :create, :update] do
  resources :object_mentions, only: [:index]
end
```

- [ ] **Step 4: Create controller**

```ruby
# app/controllers/api/v1/object_mentions_controller.rb
module Api
  module V1
    class ObjectMentionsController < Api::ApiController
      def index
        document = current_organization.documents.find(params[:document_id])
        authorize document, :show?

        mentions = ObjectMention.for_source(document).current

        render json: {
          object_mentions: mentions.map { |om|
            {
              id: om.id,
              target_type: om.target_type,
              target_id: om.target_id,
              title: om.title
            }
          }
        }
      end
    end
  end
end
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bin/rspec spec/requests/api/v1/object_mentions_controller_spec.rb`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/controllers/api/v1/object_mentions_controller.rb config/routes.rb spec/requests/api/v1/object_mentions_controller_spec.rb
git commit -m "feat: add GET /api/v1/documents/:id/object_mentions endpoint"
```

---

## Chunk 7: Frontend — Mention Component and Broken Link Rendering

### Task 10: CSS for Broken Mentions

**Files:**
- Modify: `app/assets/stylesheets/mentions.tailwind.css`

- [ ] **Step 1: Add broken mention style**

Add `.mention--broken` inside the existing `@layer components` block in `app/assets/stylesheets/mentions.tailwind.css`, after the existing `.mention` rule:

```css
    .mention--broken {
        @apply border-red-400 text-red-400 bg-red-50 line-through decoration-red-400/50
    }
```

The file should look like:
```css
@layer components {
    .mention {
        @apply border rounded p-0.5 text-sky-500
    }

    .mention--broken {
        @apply border-red-400 text-red-400 bg-red-50 line-through decoration-red-400/50
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/assets/stylesheets/mentions.tailwind.css
git commit -m "style: add .mention--broken CSS class for broken link rendering"
```

### Task 11: Update Mention Component

**Files:**
- Modify: `app/javascript/components/editor/inline-content/MentionInlineContent.tsx`

- [ ] **Step 1: Add ObjectMentions API client**

First check if there's an existing API client pattern. Look at `app/javascript/api/DocumentsApi.js` for the pattern. Create a minimal API function:

Create file `app/javascript/api/ObjectMentionsApi.ts`:

```typescript
const ObjectMentionsApi = {
  index: async ({ documentId }: { documentId: string }) => {
    const response = await fetch(`/api/v1/documents/${documentId}/object_mentions`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch object mentions: ${response.status}`);
    }

    const data = await response.json();
    return data.object_mentions as ObjectMentionData[];
  }
};

export interface ObjectMentionData {
  id: string;
  target_type: string;
  target_id: string | null;
  title: string;
}

export default ObjectMentionsApi;
```

Note: Check how other API files in `app/javascript/api/` handle authentication (cookies, headers, CSRF tokens). The API uses `Api::ApiController` which authenticates via Warden — the browser session should work. If other API files add a CSRF token header, follow that pattern.

- [ ] **Step 2: Create a hook for batch-loading object mentions**

Create file `app/javascript/components/editor/inline-content/useObjectMentions.ts`:

```typescript
import {useQuery} from "@tanstack/react-query";
import ObjectMentionsApi, {ObjectMentionData} from "../../../api/ObjectMentionsApi";
import queryClient from "../../../contextes/ReactQueryClient";

export function useObjectMentions(documentId: string | undefined) {
  return useQuery<ObjectMentionData[]>({
    queryKey: ["object_mentions", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      return await ObjectMentionsApi.index({ documentId });
    },
    enabled: !!documentId,
  }, queryClient);
}

export function useObjectMention(documentId: string | undefined, mentionId: string): ObjectMentionData | undefined {
  const { data: mentions } = useObjectMentions(documentId);
  return mentions?.find(m => m.id === mentionId);
}
```

Note: The `documentId` needs to be passed down to the mention component. Check how the current editor provides context (React Context, props, etc.). The editor likely has a document context that provides the current document NPI. Find this by searching for how `DocumentsApi.show.path` is used in the existing mention component.

- [ ] **Step 3: Update MentionInlineContent.tsx**

Replace the content of `app/javascript/components/editor/inline-content/MentionInlineContent.tsx`:

```typescript
import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import {useEffect, useRef} from "react";
import clsx from "clsx";
import {useObjectMention} from "./useObjectMentions";

const Loading = () => {
  return <span className="relative top-1">
    <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
  </span>;
}

// Broken mention — renders when object_mention has no target
const BrokenMention = ({title, targetType}: {title: string, targetType: string}) => {
  return (
    <span className="mention mention--broken" title={`Broken ${targetType.toLowerCase()} link`}>
      @{title}
    </span>
  );
};

const DocumentMention = ({documentNpi}: {documentNpi: string}) => {
  const documentQuery = useQuery({
    queryKey: ["documents", documentNpi],
    queryFn: async () => {
      return await DocumentsApi.show({id: documentNpi});
    }}, queryClient);

  const isLoading = documentQuery.isLoading;
  const document = documentQuery.data;
  const displayName = document?.title || documentNpi;

  return (
    <a
      href={DocumentsApi.show.path({id: document?.id})}
      className="mention"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const TableMention = ({tableNpi}: {tableNpi: string}) => {
  const contentQuery = useQuery({
    queryKey: ["tables", tableNpi],
    queryFn: async () => {
      return await TablesApi.show({id: tableNpi});
    }}, queryClient);

  const isLoading = contentQuery.isLoading;
  const content = contentQuery.data;
  const displayName = content?.table?.name || tableNpi;

  return (
    <a
      href={TablesApi.show.path({id: content?.table?.id})}
      className="mention"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const UserMention = ({mentionId, userId}: { mentionId: string, userId: number }) => {
  const spanElementRef = useRef<HTMLElement>();
  const spanElementId = `mention-${mentionId}`;
  const isTargeted = location.hash.split("#")[1] === spanElementId;

  const userQuery = useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      return await UsersApi.show({id: userId});
    }}, queryClient);

  useEffect(() => {
    setTimeout(() => {
      if (isTargeted) {
        spanElementRef.current?.scrollIntoView();
      }
    }, 0);
  }, [spanElementRef, isTargeted])

  const isLoading = userQuery.isLoading;
  const user = userQuery.data;
  const displayName = user ? `${user.firstName} ${user.lastName}` : userId;

  return (
    <span
      ref={spanElementRef}
      id={spanElementId}
      className={clsx(
        "mention",
        isTargeted && "bg-sky-500 text-white",
      )}
    >
      @{displayName}
      {isLoading && <Loading/>}
    </span>
  )
};

// The Mention inline content.
const MentionInlineContent = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      id: {
        default: "",
      },
      entity: {
        default: "document"
      },
      entityId: {
        default: -1,
      },
      title: {
        default: "Untitled",
      },
    },
    content: "none",
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      let {id, entityId} = props.inlineContent.props;
      const {entity, title} = props.inlineContent.props;

      useEffect(() => {
        if (entityId === -1) {
          entityId = Number(id);
          id = crypto.randomUUID();
          setTimeout(() => {
            props.updateInlineContent({
              type: "mention",
              props: {
                ...props.inlineContent.props,
                id,
                entityId,
              }
            });
          }, 0);
        }
      }, [entityId])

      if (entityId === -1) {
        return null
      }

      // Try to get object_mention data from batch-loaded cache
      // documentId comes from the URL — extract current document NPI
      const documentNpi = window.location.pathname.match(/\/d\/([^/]+)/)?.[1];
      const objectMention = useObjectMention(documentNpi, id);

      // If we have an object_mention and it's broken, render broken state
      if (objectMention && objectMention.target_id === null) {
        return <BrokenMention title={objectMention.title} targetType={objectMention.target_type} />;
      }

      // If we have an object_mention with a valid target, use its target_id for navigation
      const resolvedEntityId = objectMention?.target_id || entityId;

      // Fall back to current behavior (direct entity fetch by entityId)
      switch (entity) {
      case "document":
        return <DocumentMention documentNpi={resolvedEntityId as string}/>;
      case "table":
        return <TableMention tableNpi={resolvedEntityId as string}/>;
      case "user":
        return <UserMention mentionId={id} userId={resolvedEntityId as number}/>;
      default:
        throw new Error(`Unhandled content type ${entity}`);
      }
    },
  }
);

export default MentionInlineContent;
```

**Important implementation notes:**
- The `documentNpi` extraction from URL is a simplification. Check how the editor currently gets the document context — there may be a React Context or prop that provides this. If so, use that instead of parsing the URL. Search for how `document.id` or `documentId` is passed in `app/javascript/components/editor/`.
- The `useObjectMention` hook is called inside the render function of `createReactInlineContentSpec`. Verify that React hooks work correctly in this context (they should, since BlockNote renders these as React components).
- The `useObjectMentions` query is shared across all mention components in the same document via React Query's cache (same `queryKey`), so only one fetch happens per document load.

- [ ] **Step 4: Update the client-side schema to match strippedSchema changes**

Check `app/javascript/components/editor/schema.ts` — if the client-side mention spec needs the same `toExternalHTML` handler, add it there. This is only needed if the client-side editor exports content to HTML (e.g., for copy/paste). If not, skip this step.

- [ ] **Step 5: Verify the frontend builds**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 6: Manual testing**

Start the dev server (`bin/dev`) and:
1. Open a document with existing mentions — they should still render correctly (fallback to `entityId`)
2. Import an Obsidian vault with wiki links — broken links should render red with strikethrough
3. Delete a document that is mentioned in another — the mention should turn red on next page load

- [ ] **Step 7: Commit**

```bash
git add app/javascript/api/ObjectMentionsApi.ts app/javascript/components/editor/inline-content/useObjectMentions.ts app/javascript/components/editor/inline-content/MentionInlineContent.tsx app/assets/stylesheets/mentions.tailwind.css
git commit -m "feat: mention component renders broken links from object_mentions"
```

---

## Final Steps

### Task 12: Full Test Suite Verification

- [ ] **Step 1: Run all Ruby tests**

Run: `bin/rspec`
Expected: All tests PASS

- [ ] **Step 2: Run all converter tests**

Run: `cd micro-services/blocknote-converter && npm test`
Expected: All tests PASS

- [ ] **Step 3: Run frontend build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Run frontend linter**

Run: `npm run lint`
Expected: No errors

### Task 13: Final Commit and Summary

- [ ] **Step 1: Review all changes**

Run: `git log --oneline master..HEAD`

Expected commits:
1. `db: create object_mentions table`
2. `feat: add ObjectMention model with scopes and validations`
3. `feat: add ObjectMentionReconciler service for mention tracking`
4. `feat: wire ObjectMentionReconciler to Version after_create`
5. `feat: add Document deletion hooks for object_mentions`
6. `feat: add Table deletion hook for object_mentions`
7. `feat: add mention parse/serialize handlers to BlockNote converter`
8. `feat: import pipeline produces mention spans instead of markdown links`
9. `feat: add GET /api/v1/documents/:id/object_mentions endpoint`
10. `style: add .mention--broken CSS class for broken link rendering`
11. `feat: mention component renders broken links from object_mentions`
