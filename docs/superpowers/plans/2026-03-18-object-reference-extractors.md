# Object Reference Extractors Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `MentionsExtractor` and `ReferencesExtractor` JSON-parsing with efficient DB queries against `object_references`, gated behind a Flipper feature flag.

**Architecture:** Extend `ObjectReferenceReconciler` to handle `advancedTable` blocks and comments, add `source_version_id`/`source_comment_id` columns for provenance tracking, backfill existing data via rake task, then swap extractor read paths behind `Flipper.enabled?(:object_reference_extractors)`.

**Tech Stack:** Ruby on Rails, PostgreSQL, RSpec, Flipper feature flags

**Spec:** `docs/superpowers/specs/2026-03-18-object-reference-extractors-design.md`

---

## File Structure

### Modified files
- `app/models/object_reference.rb` — expand `ALLOWED_SOURCE_TYPES`
- `app/services/object_reference_reconciler.rb` — new signature, advancedTable extraction, comment reconciliation, `created_at`/`source_version_id` tracking
- `app/models/version.rb` — update callback to pass `self`
- `app/models/object_comment.rb` — add reconciliation callbacks
- `app/models/table.rb` — add `source_object_references` association
- `app/services/mentions_extractor.rb` — feature-flagged `from_object_references` path
- `app/services/references_extractor.rb` — feature-flagged `from_object_references` path
- `spec/services/object_reference_reconciler_spec.rb` — extend with advancedTable, version tracking, comment reconciliation specs
- `spec/services/references_extractor_spec.rb` — convert to shared examples, run with both flag states
- `spec/fixtures/object_references.yml` — add comment-sourced and version-tracked fixtures

### New files
- `db/migrate/YYYYMMDDHHMMSS_add_provenance_to_object_references.rb` — migration
- `lib/tasks/object_references.rake` — backfill rake task
- `spec/services/mentions_extractor_spec.rb` — new spec file with shared examples for both paths
- `spec/tasks/object_references_rake_spec.rb` — rake task specs

---

## Task 1: Database Migration

Add `source_version_id` and `source_comment_id` columns with partial indexes.

**Files:**
- Create: `db/migrate/YYYYMMDDHHMMSS_add_provenance_to_object_references.rb`

- [ ] **Step 1: Generate migration**

Run: `bin/rails generate migration AddProvenanceToObjectReferences`

- [ ] **Step 2: Write migration**

```ruby
class AddProvenanceToObjectReferences < ActiveRecord::Migration[8.1]
  def change
    # bigint to match versions.id (default Rails bigint PK)
    add_column :object_references, :source_version_id, :bigint, null: true
    # bigint to match object_comments.id (default Rails bigint PK)
    add_column :object_references, :source_comment_id, :bigint, null: true

    add_index :object_references, :source_version_id, where: "source_version_id IS NOT NULL"
    add_index :object_references, :source_comment_id, where: "source_comment_id IS NOT NULL"
  end
end
```

- [ ] **Step 3: Run migration**

Run: `bin/rails db:migrate`
Expected: Migration succeeds, `db/schema.rb` updated with new columns and indexes.

- [ ] **Step 4: Update ObjectReference model**

In `app/models/object_reference.rb`, expand `ALLOWED_SOURCE_TYPES`:

```ruby
ALLOWED_SOURCE_TYPES = %w[Document Table].freeze
```

- [ ] **Step 5: Add source_object_references to Table model**

In `app/models/table.rb`, add (matching the existing association on Document):

```ruby
has_many :source_object_references, class_name: "ObjectReference", as: :source, dependent: :delete_all
```

- [ ] **Step 6: Run existing specs to confirm no regressions**

Run: `bin/rspec spec/models/object_reference_spec.rb spec/services/object_reference_reconciler_spec.rb`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add db/migrate/*_add_provenance_to_object_references.rb db/schema.rb app/models/object_reference.rb app/models/table.rb
git commit -m "Add source_version_id and source_comment_id to object_references"
```

---

## Task 2: Extend ObjectReferenceReconciler — Version Tracking

Change the reconciler signature to accept a version object, store `source_version_id` and explicitly set `created_at`.

**Files:**
- Modify: `app/services/object_reference_reconciler.rb`
- Modify: `app/models/version.rb:37-39` (callback)
- Modify: `spec/services/object_reference_reconciler_spec.rb`

- [ ] **Step 1: Write failing tests for version tracking**

In `spec/services/object_reference_reconciler_spec.rb`, add to the `.reconcile` describe block:

```ruby
it "sets source_version_id to the version's id" do
  uuid = SecureRandom.uuid
  version = document.versions.create!(
    content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
    created_by: users(:pawel)
  )

  ref = ObjectReference.find(uuid)
  expect(ref.source_version_id).to eq(version.id)
end

it "sets created_at to the version's created_at, not current time" do
  uuid = SecureRandom.uuid
  old_time = 3.days.ago.change(usec: 0)
  version = document.versions.create!(
    content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
    created_by: users(:pawel),
    created_at: old_time
  )

  ref = ObjectReference.find(uuid)
  expect(ref.created_at).to eq(old_time)
end

it "preserves source_version_id and created_at when mention reappears in newer version" do
  uuid = SecureRandom.uuid
  old_time = 3.days.ago.change(usec: 0)
  v1 = document.versions.create!(
    content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
    created_by: users(:pawel),
    created_at: old_time
  )

  # Newer version still has the same mention
  document.versions.create!(
    content_blocks: [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)],
    created_by: users(:pawel)
  )

  ref = ObjectReference.find(uuid)
  expect(ref.source_version_id).to eq(v1.id)
  expect(ref.created_at).to eq(old_time)
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: New tests fail (source_version_id is nil, created_at is auto-set).

- [ ] **Step 3: Update reconciler signature and implementation**

In `app/services/object_reference_reconciler.rb`:

Change class method:
```ruby
def self.reconcile(document, version)
  new(document).reconcile(version)
end
```

Change instance method:
```ruby
def reconcile(version)
  @version = version
  content_blocks = version.content_blocks
  mention_nodes = extract_references(content_blocks)
  mention_ids = mention_nodes.map { |m| m[:id] }

  target_data = batch_fetch_targets(mention_nodes)
  existing_mentions = ObjectReference.for_source(@document).where(source_comment_id: nil).index_by(&:id)

  mention_nodes.each do |node|
    target_type = ENTITY_TO_TYPE[node[:entity]]
    next unless target_type

    entity_id = node[:entity_id].to_s
    target_info = target_data.dig(target_type, entity_id)
    target_id = target_info ? entity_id : nil

    title = target_info&.dig(:title) || node[:title].presence || "Untitled"

    if (existing = existing_mentions[node[:id]])
      # Preserve source_version_id and created_at (first-seen semantics)
      existing.update!(current: true, title: title, target_id: target_id)
    else
      ObjectReference.create!(
        id: node[:id],
        source: @document,
        target_type: target_type,
        target_id: target_id,
        title: title,
        current: true,
        organization: @organization,
        source_version_id: version.id,
        created_at: version.created_at
      )
    end
  end

  ObjectReference.for_source(@document)
               .where(source_comment_id: nil)
               .where.not(id: mention_ids)
               .where(current: true)
               .update_all(current: false)
end
```

Rename `extract_mentions` to `extract_references` (all internal calls).

- [ ] **Step 4: Update Version callback**

In `app/models/version.rb`, change the private method:

```ruby
def reconcile_object_references
  ObjectReferenceReconciler.reconcile(document, self) if content_blocks.present?
end
```

- [ ] **Step 5: Update existing tests that call reconcile directly**

In `spec/services/object_reference_reconciler_spec.rb`, existing tests call `described_class.reconcile(document, blocks)`. These need to create a version and pass it instead. Update the `mention_block` helper and all direct `reconcile` calls:

For tests that need to call the reconciler directly without triggering the callback, create a version with `content_blocks` but call reconcile manually. Since the `after_create` callback already calls reconcile, the simplest approach is to rely on version creation triggering reconciliation in most tests.

For tests that need explicit control (like the idempotency test), create the version first, then call `described_class.reconcile(document, version)` a second time.

- [ ] **Step 6: Run all reconciler and version tests**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb spec/models/version_spec.rb`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add app/services/object_reference_reconciler.rb app/models/version.rb spec/services/object_reference_reconciler_spec.rb
git commit -m "Track source_version_id and created_at in ObjectReferenceReconciler"
```

---

## Task 3: Extend ObjectReferenceReconciler — advancedTable Blocks

Add extraction of `advancedTable` blocks as Table references.

**Files:**
- Modify: `app/services/object_reference_reconciler.rb`
- Modify: `spec/services/object_reference_reconciler_spec.rb`

- [ ] **Step 1: Write failing tests**

In `spec/services/object_reference_reconciler_spec.rb`:

```ruby
context "advancedTable blocks" do
  let(:table) { Table.create!(name: "Test Table", organization: organization, space: space) }

  def advanced_table_block(id:, table_npi: nil, table_id: nil)
    props = { "viewId" => "view1" }
    props["tableNpi"] = table_npi if table_npi
    props["tableId"] = table_id if table_id
    {
      "id" => id,
      "type" => "advancedTable",
      "props" => props,
      "children" => []
    }
  end

  it "creates object_reference for advancedTable block using tableNpi" do
    uuid = SecureRandom.uuid
    version = document.versions.create!(
      content_blocks: [advanced_table_block(id: uuid, table_npi: table.id)],
      created_by: users(:pawel)
    )

    ref = ObjectReference.find(uuid)
    expect(ref.target_type).to eq("Table")
    expect(ref.target_id).to eq(table.id)
    expect(ref.current).to be true
  end

  it "falls back to tableId when tableNpi is absent" do
    uuid = SecureRandom.uuid
    version = document.versions.create!(
      content_blocks: [advanced_table_block(id: uuid, table_id: table.id)],
      created_by: users(:pawel)
    )

    ref = ObjectReference.find(uuid)
    expect(ref.target_type).to eq("Table")
    expect(ref.target_id).to eq(table.id)
  end

  it "skips advancedTable blocks with blank table IDs" do
    uuid = SecureRandom.uuid
    expect {
      document.versions.create!(
        content_blocks: [advanced_table_block(id: uuid, table_npi: "", table_id: "")],
        created_by: users(:pawel)
      )
    }.not_to change(ObjectReference, :count)
  end

  it "creates broken reference for nonexistent table" do
    uuid = SecureRandom.uuid
    version = document.versions.create!(
      content_blocks: [advanced_table_block(id: uuid, table_npi: "nonexistent")],
      created_by: users(:pawel)
    )

    ref = ObjectReference.find(uuid)
    expect(ref).to be_broken
    expect(ref.target_type).to eq("Table")
  end
end
```

Note: Check which table fixtures exist. If no `tables` fixtures are loaded, add `fixtures :tables` and use whatever table fixture name is available (look at `spec/fixtures/tables.yml`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: New tests fail.

- [ ] **Step 3: Update extract_references to handle advancedTable**

In the `extract_references` method (formerly `extract_mentions`) in `app/services/object_reference_reconciler.rb`:

```ruby
def extract_references(blocks)
  references = []
  walk_blocks(blocks) do |node|
    next unless node.is_a?(Hash)

    if node["type"] == "mention"
      props = node["props"] || {}
      id = props["id"].to_s
      entity_id = props["entityId"]

      next if id.blank?
      next if entity_id == -1 || entity_id == "-1"

      references << {
        id: id,
        entity: props["entity"].to_s,
        entity_id: entity_id,
        title: props["title"].to_s
      }
    elsif node["type"] == "advancedTable"
      props = node["props"] || {}
      id = node["id"].to_s
      entity_id = props["tableNpi"].presence || props["tableId"].presence

      next if id.blank?
      next if entity_id.blank?

      references << {
        id: id,
        entity: "table",
        entity_id: entity_id,
        title: ""
      }
    end
  end
  references
end
```

- [ ] **Step 4: Run tests**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add app/services/object_reference_reconciler.rb spec/services/object_reference_reconciler_spec.rb
git commit -m "Extract advancedTable blocks as Table references in ObjectReferenceReconciler"
```

---

## Task 4: Comment Reconciliation

Add `reconcile_comment` to the reconciler and callbacks to `ObjectComment`.

**Files:**
- Modify: `app/services/object_reference_reconciler.rb`
- Modify: `app/models/object_comment.rb`
- Modify: `spec/services/object_reference_reconciler_spec.rb`

- [ ] **Step 1: Write failing tests for comment reconciliation**

In `spec/services/object_reference_reconciler_spec.rb`:

```ruby
describe ".reconcile_comment" do
  let(:org_membership) { organization_memberships(:om_is_pawel) }

  def create_comment(object:, content:)
    ObjectComment.create!(
      object: object,
      organization: organization,
      organization_membership: org_membership,
      content: content
    )
  end

  it "creates object_references from comment content" do
    uuid = SecureRandom.uuid
    content = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    comment = create_comment(object: document, content: content)

    ref = ObjectReference.find(uuid)
    expect(ref.source_type).to eq("Document")
    expect(ref.source_id).to eq(document.id)
    expect(ref.source_comment_id).to eq(comment.id)
    expect(ref.source_version_id).to be_nil
    expect(ref.target_type).to eq("Document")
    expect(ref.target_id).to eq(documents(:two).id)
    expect(ref.current).to be true
  end

  it "sets created_at to comment.created_at" do
    uuid = SecureRandom.uuid
    old_time = 3.days.ago.change(usec: 0)
    content = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    comment = create_comment(object: document, content: content)
    comment.update_column(:created_at, old_time)

    # Re-reconcile to pick up the updated created_at
    ObjectReference.where(source_comment_id: comment.id).delete_all
    described_class.reconcile_comment(comment.reload)

    ref = ObjectReference.find(uuid)
    expect(ref.created_at).to eq(old_time)
  end

  it "removes references when mention is removed from comment" do
    uuid = SecureRandom.uuid
    content = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    comment = create_comment(object: document, content: content)

    expect(ObjectReference.find_by(id: uuid)).to be_present

    # Update comment to remove the mention
    comment.update!(content: [{"id" => "block-1", "type" => "paragraph", "content" => [], "children" => []}])
    expect(ObjectReference.find_by(id: uuid)).to be_nil
  end

  it "deletes all references when comment is destroyed" do
    uuid = SecureRandom.uuid
    content = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    comment = create_comment(object: document, content: content)

    expect(ObjectReference.find_by(id: uuid)).to be_present
    comment.destroy!
    expect(ObjectReference.find_by(id: uuid)).to be_nil
  end

  it "does not touch version-sourced references for the same document" do
    version_uuid = SecureRandom.uuid
    comment_uuid = SecureRandom.uuid

    # Create version-sourced reference
    document.versions.create!(
      content_blocks: [mention_block(id: version_uuid, entity: "document", entity_id: documents(:two).id)],
      created_by: users(:pawel)
    )

    # Create then destroy comment
    content = [mention_block(id: comment_uuid, entity: "document", entity_id: documents(:two).id)]
    comment = create_comment(object: document, content: content)
    comment.destroy!

    # Version-sourced reference should still exist
    expect(ObjectReference.find_by(id: version_uuid)).to be_present
    expect(ObjectReference.find_by(id: comment_uuid)).to be_nil
  end

  it "works for comments on Tables" do
    table = Table.first
    skip "No tables in test database" unless table
    uuid = SecureRandom.uuid
    content = [mention_block(id: uuid, entity: "document", entity_id: documents(:two).id)]
    comment = ObjectComment.create!(
      object: table,
      organization: organization,
      organization_membership: org_membership,
      content: content
    )

    ref = ObjectReference.find(uuid)
    expect(ref.source_type).to eq("Table")
    expect(ref.source_id).to eq(table.id)
    expect(ref.source_comment_id).to eq(comment.id)
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: New tests fail (`reconcile_comment` method doesn't exist).

- [ ] **Step 3: Implement reconcile_comment**

In `app/services/object_reference_reconciler.rb`, add:

```ruby
def self.reconcile_comment(comment)
  new(comment.object).reconcile_comment(comment)
end

def reconcile_comment(comment)
  reference_nodes = extract_references(comment.content)
  reference_ids = reference_nodes.map { |m| m[:id] }

  target_data = batch_fetch_targets(reference_nodes)

  existing_refs = ObjectReference.where(source_comment_id: comment.id).index_by(&:id)

  reference_nodes.each do |node|
    target_type = ENTITY_TO_TYPE[node[:entity]]
    next unless target_type

    entity_id = node[:entity_id].to_s
    target_info = target_data.dig(target_type, entity_id)
    target_id = target_info ? entity_id : nil

    title = target_info&.dig(:title) || node[:title].presence || "Untitled"

    if (existing = existing_refs[node[:id]])
      existing.update!(title: title, target_id: target_id)
    else
      ObjectReference.create!(
        id: node[:id],
        source: @document,
        target_type: target_type,
        target_id: target_id,
        title: title,
        current: true,
        organization: @organization,
        source_comment_id: comment.id,
        created_at: comment.created_at
      )
    end
  end

  # Remove references for mentions no longer in this comment
  ObjectReference.where(source_comment_id: comment.id)
               .where.not(id: reference_ids)
               .delete_all
end
```

Important: Since the reconciler now handles Tables (via comments), rename the internal `@document` ivar to `@source_object` throughout the reconciler. Update `initialize` to `@source_object = source_object` and all references (`@document` → `@source_object`). Update `@organization = document.organization` to `@organization = source_object.organization`. The class method becomes `new(document).reconcile(version)` and `new(comment.object).reconcile_comment(comment)` — the argument name in `initialize` changes but the call sites stay the same.

- [ ] **Step 4: Add callbacks to ObjectComment**

In `app/models/object_comment.rb`, add:

```ruby
after_create :reconcile_object_references
after_update :reconcile_object_references
before_destroy :delete_object_references

private

def reconcile_object_references
  ObjectReferenceReconciler.reconcile_comment(self)
end

def delete_object_references
  ObjectReference.where(source_comment_id: id).delete_all
end
```

Note: Use unconditional `after_update` — the `ObjectComment` model overrides the `content` method with JSON parsing logic (line 24-30), which makes `saved_change_to_content?` unreliable for detecting actual content changes. The reconciler is idempotent, so running it on non-content updates is harmless.

- [ ] **Step 5: Run tests**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: All pass.

- [ ] **Step 6: Run full model specs to check for regressions**

Run: `bin/rspec spec/models/object_reference_spec.rb spec/models/version_spec.rb`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add app/services/object_reference_reconciler.rb app/models/object_comment.rb spec/services/object_reference_reconciler_spec.rb
git commit -m "Add comment reconciliation to ObjectReferenceReconciler"
```

---

## Task 5: Update Fixtures

Add fixtures for comment-sourced and version-tracked object references used by extractor specs.

**Files:**
- Modify: `spec/fixtures/object_references.yml`

- [ ] **Step 1: Add new fixtures**

In `spec/fixtures/object_references.yml`, add:

```yaml
doc_mention_with_version:
  id: "550e8400-e29b-41d4-a716-446655440010"
  source_type: Document
  source_id: one
  target_type: User
  target_id: "user_stefan"
  title: Stefan Piotrowski
  current: true
  organization_id: "is"
  source_version_id: two_version_1
  created_at: <%= 3.days.ago.iso8601 %>

non_current_user_mention:
  id: "550e8400-e29b-41d4-a716-446655440011"
  source_type: Document
  source_id: two
  target_type: User
  target_id: "user_stefan"
  title: Stefan Piotrowski
  current: false
  organization_id: "is"
  source_version_id: two_version_1
  created_at: <%= 5.days.ago.iso8601 %>
```

Note: `source_version_id` is a bigint FK. In fixtures, Rails will resolve the fixture name `two_version_1` to its bigint ID automatically via the `ActiveRecord::FixtureSet.identify` helper. Verify that `two_version_1` exists in `spec/fixtures/versions.yml` and `user_stefan` exists in `spec/fixtures/users.yml`.

- [ ] **Step 2: Run existing specs to confirm fixtures load**

Run: `bin/rspec spec/models/object_reference_spec.rb`
Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add spec/fixtures/object_references.yml
git commit -m "Add version-tracked and comment-sourced object reference fixtures"
```

---

## Task 6: ReferencesExtractor — Feature-Flagged DB Path

Add `from_object_references` path and restructure specs as shared examples.

**Files:**
- Modify: `app/services/references_extractor.rb`
- Modify: `spec/services/references_extractor_spec.rb`

- [ ] **Step 1: Rename existing method to from_blocknote**

In `app/services/references_extractor.rb`, rename `all_references` to `from_blocknote` (private), and create a new `all_references` that dispatches:

```ruby
class ReferencesExtractor
  def self.all_references(documents)
    if Flipper.enabled?(:object_reference_extractors)
      from_object_references(documents)
    else
      from_blocknote(documents)
    end
  end

  def self.from_object_references(documents)
    docs_by_id = documents.index_by(&:id)

    refs = ObjectReference.where(
      source_type: "Document",
      source_id: docs_by_id.keys,
      current: true,
      target_type: ["Document", "Table"]
    ).where.not(target_id: nil) # Exclude broken references (from_blocknote skips blank entityId)

    unique_references = {}

    refs.each do |ref|
      key = [ref.source_id, ref.target_type, ref.target_id]
      next if unique_references.key?(key)

      unique_references[key] = DocumentReference.new(
        referenced_by: docs_by_id[ref.source_id],
        referenced_type: ref.target_type,
        referenced_id: ref.target_id
      )
    end

    unique_references.values
  end

  private

  # ... existing all_references logic renamed to from_blocknote ...
  def self.from_blocknote(documents)
    # (move existing all_references body here)
  end
end
```

- [ ] **Step 2: Run existing tests with flag disabled to verify from_blocknote path**

Run: `bin/rspec spec/services/references_extractor_spec.rb`
Expected: All pass (flag defaults to disabled, so from_blocknote path runs).

- [ ] **Step 3: Convert specs to shared examples**

Restructure `spec/services/references_extractor_spec.rb` to use shared examples. The key behavioral specs that must pass under both flag states:

```ruby
require "rails_helper"

RSpec.describe ReferencesExtractor do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:pawel) }

  def unique_id(prefix = "id")
    "#{prefix}_#{SecureRandom.hex(6)}"
  end

  shared_examples "all_references behavior" do
    # All existing test contexts go here, unchanged:
    # - extracting references from document versions
    # - extracting references from advancedTable blocks (tableNpi and tableId fallback)
    # - extracting references from document comments
    # - handling nested blocks
    # - de-duplicating references
    # - handling multiple documents
    # - edge cases (empty content, blank IDs, no versions, nil entityId, unsupported entity types)
    # - only uses latest version
    # - case sensitivity in entity types

    # (Move all existing contexts/examples into this shared example group)
  end

  context "with object_reference_extractors flag disabled (from_blocknote)" do
    before { Flipper.disable(:object_reference_extractors) }

    include_examples "all_references behavior"
  end

  context "with object_reference_extractors flag enabled (from_object_references)" do
    before { Flipper.enable(:object_reference_extractors) }

    include_examples "all_references behavior"

    # Additional DB-path-specific specs
    it "uses documents collection for referenced_by (no extra queries)" do
      # Verify the returned DocumentReference's referenced_by is the same
      # object instance from the input documents array
      doc = documents(:one)
      docs = [doc]
      Version.create!(
        document: doc,
        content_blocks: [
          {
            "id" => unique_id("block"),
            "type" => "paragraph",
            "content" => [
              {
                "type" => "mention",
                "props" => {
                  "id" => unique_id("mention"),
                  "entity" => "document",
                  "entityId" => "some_doc_id"
                }
              }
            ]
          }
        ],
        created_by: user
      )

      references = described_class.all_references(docs)
      expect(references.first.referenced_by).to equal(doc) # same object identity
    end
  end
end
```

Important: The shared examples must set up test data by creating Version/ObjectComment records (as existing tests do). The version `after_create` callback triggers reconciliation, so `object_references` rows are automatically created. This means the same test setup works for both paths.

- [ ] **Step 4: Run all specs with both flag states**

Run: `bin/rspec spec/services/references_extractor_spec.rb`
Expected: All pass under both flag states.

- [ ] **Step 5: Commit**

```bash
git add app/services/references_extractor.rb spec/services/references_extractor_spec.rb
git commit -m "Add feature-flagged DB query path to ReferencesExtractor"
```

---

## Task 7: MentionsExtractor — Feature-Flagged DB Path

Add `from_object_references` path and create spec file with shared examples.

**Files:**
- Modify: `app/services/mentions_extractor.rb`
- Create: `spec/services/mentions_extractor_spec.rb`

- [ ] **Step 1: Write shared example specs**

Create `spec/services/mentions_extractor_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe MentionsExtractor do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:stefan) }
  let(:author) { users(:pawel) }

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

  shared_examples "get_all_mentions behavior" do
    context "extracting user mentions from document versions" do
      let(:document) { documents(:one) }

      it "returns mentions targeting the specified user" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.mention_id).to eq(mention_id)
      end

      it "does not return mentions targeting a different user" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: "other_user_id"),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to be_empty
      end

      it "does not return document/table mentions" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "document", entity_id: documents(:two).id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to be_empty
      end

      it "sets created_at to the version timestamp where mention first appeared" do
        mention_id = unique_id("mention")
        old_time = 3.days.ago.change(usec: 0)
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: old_time
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.created_at).to eq(old_time)
      end

      it "sets object_title to the document title" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_title).to eq(document.title)
      end
    end

    context "current vs non-current mentions" do
      let(:document) { documents(:one) }

      it "links current mentions to document path" do
        mention_id = unique_id("mention")
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_path).to include(document.id)
        expect(mentions.first.object_path).to include("mention-#{mention_id}")
        expect(mentions.first.object_path).not_to include("versions")
      end

      it "links non-current mentions to version path" do
        mention_id = unique_id("mention")

        # Version 1 has the mention
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: 3.days.ago
        )

        # Version 2 removes the mention
        document.versions.create!(
          content_blocks: [{"id" => unique_id("block"), "type" => "paragraph", "content" => [], "children" => []}],
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.object_path).to include("versions")
        expect(mentions.first.object_path).to include("mention-#{mention_id}")
      end
    end

    context "mentions from comments" do
      let(:document) { documents(:one) }
      let(:org_membership) { organization_memberships(:om_is_pawel) }

      it "includes mentions from document comments" do
        mention_id = unique_id("mention")
        ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: mention_content(mention_id, entity: "user", entity_id: user.id)
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
        expect(mentions.first.mention_id).to eq(mention_id)
      end

      it "links comment mentions to document path" do
        mention_id = unique_id("mention")
        ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: mention_content(mention_id, entity: "user", entity_id: user.id)
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.first.object_path).to include(document.id)
        expect(mentions.first.object_path).not_to include("versions")
      end
    end

    context "deduplication" do
      let(:document) { documents(:one) }

      it "deduplicates mentions by mention_id across versions" do
        mention_id = unique_id("mention")

        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author,
          created_at: 2.days.ago
        )
        document.versions.create!(
          content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([document], user)
        expect(mentions.length).to eq(1)
      end
    end

    context "multiple documents" do
      it "extracts mentions from all provided documents" do
        doc1 = documents(:one)
        doc2 = documents(:two)

        id1 = unique_id("mention")
        id2 = unique_id("mention")

        doc1.versions.create!(
          content_blocks: mention_content(id1, entity: "user", entity_id: user.id),
          created_by: author
        )
        doc2.versions.create!(
          content_blocks: mention_content(id2, entity: "user", entity_id: user.id),
          created_by: author
        )

        mentions = described_class.get_all_mentions([doc1, doc2], user)
        expect(mentions.length).to eq(2)
      end
    end

    context "edge cases" do
      let(:document) { documents(:one) }

      it "returns empty array for documents with no versions or comments" do
        mentions = described_class.get_all_mentions([document], user)
        expect(mentions).to eq([])
      end

      it "returns empty array for empty document array" do
        mentions = described_class.get_all_mentions([], user)
        expect(mentions).to eq([])
      end
    end

    it "returns Mention structs with EmojiExtractable" do
      document = documents(:one)
      mention_id = unique_id("mention")
      document.versions.create!(
        content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
        created_by: author
      )

      mentions = described_class.get_all_mentions([document], user)
      expect(mentions.first).to be_a(Mention)
      expect(mentions.first).to respond_to(:object_title_emoji)
      expect(mentions.first).to respond_to(:object_title_emojiless)
    end
  end

  context "with object_reference_extractors flag disabled (from_blocknote)" do
    before { Flipper.disable(:object_reference_extractors) }

    include_examples "get_all_mentions behavior"
  end

  context "with object_reference_extractors flag enabled (from_object_references)" do
    before { Flipper.enable(:object_reference_extractors) }

    include_examples "get_all_mentions behavior"
  end
end
```

- [ ] **Step 2: Run tests with flag disabled to verify existing behavior**

Run: `bin/rspec spec/services/mentions_extractor_spec.rb`
Expected: Tests pass with flag disabled, fail with flag enabled (from_object_references not implemented yet).

- [ ] **Step 3: Implement from_object_references in MentionsExtractor**

In `app/services/mentions_extractor.rb`:

```ruby
class MentionsExtractor
  extend Rails.application.routes.url_helpers

  def self.get_all_mentions(documents, user)
    if Flipper.enabled?(:object_reference_extractors)
      from_object_references(documents, user)
    else
      from_blocknote(documents, user)
    end
  end

  def self.from_object_references(documents, user)
    docs_by_id = documents.index_by(&:id)
    return [] if docs_by_id.empty?

    refs = ObjectReference.where(
      target_type: "User",
      target_id: user.id,
      source_type: "Document",
      source_id: docs_by_id.keys
    )

    # Batch-load versions for non-current refs that need version paths
    non_current_version_ids = refs.select { |r| !r.current? && r.source_version_id.present? }
                                  .map(&:source_version_id)
    versions_by_id = if non_current_version_ids.any?
                       Version.where(id: non_current_version_ids).index_by(&:id)
                     else
                       {}
                     end

    refs.map do |ref|
      doc = docs_by_id[ref.source_id]
      next unless doc

      Mention.new(
        mention_id: ref.id,
        created_at: ref.created_at,
        object_title: doc.title,
        object_path: mention_path_for(ref, doc, versions_by_id)
      )
    end.compact
  end

  private

  def self.mention_path_for(ref, doc, versions_by_id)
    anchor = "mention-#{ref.id}"

    if ref.current? || ref.source_comment_id.present?
      document_path(doc, anchor: anchor)
    elsif ref.source_version_id.present?
      version = versions_by_id[ref.source_version_id]
      if version
        document_version_path(doc, version, anchor: anchor)
      else
        document_path(doc, anchor: anchor)
      end
    else
      document_path(doc, anchor: anchor)
    end
  end

  def self.from_blocknote(documents, user)
    # (existing get_all_mentions body, moved here)
    all_mentions_by_id = Hash.new

    documents.each do |document|
      document_versions = document.versions.order(sequential_id: :asc)
      document_versions.each do |version|
        mentions_ids = mentions_from_blocknote(version.content_blocks, user)
        mentions_ids.each do |mention_id|
          if all_mentions_by_id.has_key?(mention_id)
            if version == document_versions.last
              all_mentions_by_id[mention_id].object_path = document_path(document, anchor: "mention-#{mention_id}")
            end
          else
            all_mentions_by_id[mention_id] = Mention.new(
              mention_id: mention_id,
              created_at: version.created_at,
              object_title: document.title,
              object_path: version == document_versions.last ?
                  document_path(document, anchor: "mention-#{mention_id}") :
                  document_version_path(document, version, anchor: "mention-#{mention_id}")
            )
          end
        end
      end

      document_comments = document.comments.order(created_at: :desc)
      document_comments.each do |comment|
        mentions_ids = mentions_from_blocknote(comment.content, user)
        mentions_ids.each do |mention_id|
          unless all_mentions_by_id.has_key?(mention_id)
            all_mentions_by_id[mention_id] = Mention.new(
              mention_id: mention_id,
              created_at: comment.created_at,
              object_title: document.title,
              object_path: document_path(document, anchor: "mention-#{mention_id}")
            )
          end
        end
      end
    end

    all_mentions_by_id.values
  end

  def self.url_options
    Rails.application.config.action_mailer.default_url_options
  end

  def self.mentions_from_blocknote(blocknote_document, user)
    assert blocknote_document.is_a?(Array), "BlockNote document should be an Array"

    all_mentions_ids = []

    blocknote_document.each do |block|
      each_mention(block) do |mention|
        if mention.dig("props", "entity") == "user" && (user.nil? || mention.dig("props", "entityId") == user.id)
          all_mentions_ids.push(mention.dig("props", "id"))
        end
      end
    end

    all_mentions_ids
  end

  def self.each_mention(node, &block)
    return unless node.is_a? Hash

    if node.dig("type") == "mention"
      yield node
    end
    node.each do |key, value|
      if key.is_a? Hash
        each_mention(key, &block)
      end

      if value.is_a? Hash
        each_mention(value, &block)
      elsif value.is_a? Array
        value.each { |elem| each_mention(elem, &block) }
      end
    end
  end
end
```

- [ ] **Step 4: Run all tests**

Run: `bin/rspec spec/services/mentions_extractor_spec.rb`
Expected: All pass under both flag states.

- [ ] **Step 5: Commit**

```bash
git add app/services/mentions_extractor.rb spec/services/mentions_extractor_spec.rb
git commit -m "Add feature-flagged DB query path to MentionsExtractor"
```

---

## Task 8: Backfill Rake Task

Create an idempotent rake task to process all existing versions and comments.

**Files:**
- Create: `lib/tasks/object_references.rake`
- Create: `spec/tasks/object_references_rake_spec.rb`

- [ ] **Step 1: Write rake task specs**

Create `spec/tasks/object_references_rake_spec.rb`:

```ruby
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
    # Clean up any object_references created by version callbacks during fixture loading
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
    # Create version without triggering callback (to simulate pre-existing data)
    Version.insert!({
      document_id: doc.id,
      sequential_id: 100,
      created_by_id: user.id,
      content_blocks: mention_content(mention_id, entity: "user", entity_id: user.id),
      created_at: 3.days.ago,
      updated_at: 3.days.ago
    })

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(id: mention_id)
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

    ref = ObjectReference.find_by(id: mention_id)
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

    ref = ObjectReference.find_by(id: mention_id)
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

    comment = ObjectComment.create!(
      object: doc,
      organization: organization,
      organization_membership: org_membership,
      content: mention_content(mention_id, entity: "user", entity_id: user.id)
    )
    # The callback already created the ref, so delete it and re-backfill
    ObjectReference.delete_all

    Rake::Task["object_references:backfill"].invoke

    ref = ObjectReference.find_by(id: mention_id)
    expect(ref).to be_present
    expect(ref.source_comment_id).to eq(comment.id)
  end
end
```

- [ ] **Step 2: Write the rake task**

Create `lib/tasks/object_references.rake`:

```ruby
namespace :object_references do
  desc "Backfill object_references from existing document versions and comments"
  task backfill: :environment do
    batch_size = ENV.fetch("BATCH_SIZE", 100).to_i

    doc_count = 0
    doc_total = Document.count
    puts "Backfilling object_references for #{doc_total} documents..."

    Document.find_each(batch_size: batch_size) do |document|
      ActiveRecord::Base.transaction do
        document.versions.order(sequential_id: :asc).each do |version|
          ObjectReferenceReconciler.reconcile(document, version)
        end

        document.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      doc_count += 1
      puts "  Processed #{doc_count}/#{doc_total} documents" if (doc_count % batch_size).zero?
    end

    table_count = 0
    tables_with_comments = Table.joins(:comments).distinct
    table_total = tables_with_comments.count
    puts "Backfilling object_references for #{table_total} tables with comments..."

    tables_with_comments.find_each(batch_size: batch_size) do |table|
      ActiveRecord::Base.transaction do
        table.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      table_count += 1
      puts "  Processed #{table_count}/#{table_total} tables" if (table_count % batch_size).zero?
    end

    puts "Backfill complete: #{doc_count} documents, #{table_count} tables, #{ObjectReference.count} total references"
  end
end
```

- [ ] **Step 3: Run rake task specs**

Run: `bin/rspec spec/tasks/object_references_rake_spec.rb`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add lib/tasks/object_references.rake spec/tasks/object_references_rake_spec.rb
git commit -m "Add idempotent backfill rake task for object_references"
```

---

## Task 9: Full Test Suite Verification

Run the complete test suite to confirm no regressions across the codebase.

**Files:** None (verification only)

- [ ] **Step 1: Run all related specs**

Run: `bin/rspec spec/models/object_reference_spec.rb spec/services/object_reference_reconciler_spec.rb spec/services/references_extractor_spec.rb spec/services/mentions_extractor_spec.rb spec/tasks/object_references_rake_spec.rb spec/requests/api/v1/object_references_controller_spec.rb`
Expected: All pass.

- [ ] **Step 2: Run broader model/controller specs that may be affected**

Run: `bin/rspec spec/models/version_spec.rb spec/models/document_spec.rb spec/models/table_spec.rb`
Expected: All pass. If version_spec.rb or document_spec.rb fail, check that the reconciler signature change didn't break any test that creates versions.

- [ ] **Step 3: Commit if any test fixes were needed**

Only if fixes were made in previous steps.

---

## Task 10: Final Commit and Summary

- [ ] **Step 1: Verify all changes are committed**

Run: `git status`
Expected: Clean working tree.

- [ ] **Step 2: Review commit history**

Run: `git log --oneline -10`
Expected: Clean sequence of commits matching the tasks above.
