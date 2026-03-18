# Object Reference Extractors — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Builds on:** [2026-03-12 Object Mentions](2026-03-12-object-mentions-design.md)

## Problem

`MentionsExtractor` and `ReferencesExtractor` parse BlockNote JSON on every request to compute user mentions and document/table references. This is slow and doesn't scale. The `object_references` table (introduced in the object mentions work) already tracks mention nodes from document versions, but has gaps:

1. `advancedTable` blocks are not extracted (ReferencesExtractor handles them)
2. Comments are not processed (both extractors scan them)
3. No version provenance — MentionsExtractor needs to know which version a mention first appeared in
4. No comment provenance — needed for cleanup on comment deletion

## Goal

Replace both extractors with efficient DB queries against `object_references`, gated behind a Flipper feature flag for safe rollout.

## Schema Changes

Three new nullable columns on `object_references`:

```ruby
add_column :object_references, :source_version_id, :string, null: true
add_column :object_references, :source_comment_id, :string, null: true
add_column :object_references, :first_reference_at, :datetime, null: true

add_index :object_references, :source_version_id, where: "source_version_id IS NOT NULL"
add_index :object_references, :source_comment_id, where: "source_comment_id IS NOT NULL"
```

### Column semantics

| Source | `source_version_id` | `source_comment_id` | `first_reference_at` | `current` |
|--------|---------------------|---------------------|-----------------|-----------|
| Version | Version ID (first seen) | NULL | `version.created_at` | true/false (managed by reconciler) |
| Comment | NULL | Comment ID | `comment.created_at` | Always true (deleted with comment) |
| Pre-migration (not yet backfilled) | NULL | NULL | NULL | Existing value |

### `first_reference_at`

`ObjectReference.created_at` reflects when the DB row was created, which during backfill would be the backfill time — not when the reference first appeared in content. `first_reference_at` is populated from `version.created_at` (for version-sourced refs) or `comment.created_at` (for comment-sourced refs). This is critical for MentionsExtractor, which uses it for sorting and unread-count filtering. Like `source_version_id`, it is set on first create and NOT overwritten on update.

### ALLOWED_SOURCE_TYPES expansion

`ObjectReference::ALLOWED_SOURCE_TYPES` expands to `%w[Document Table]` to support comments on Tables.

## ObjectReferenceReconciler Changes

### 1. advancedTable block extraction

The `extract_mentions` method (renamed to `extract_references`) recognizes both `mention` nodes and `advancedTable` blocks:

- **mention nodes** (existing): `{id: props.id, entity: props.entity, entity_id: props.entityId, title: props.title}`
- **advancedTable blocks** (new): `{id: block.id, entity: "table", entity_id: props.tableNpi || props.tableId, title: ""}` — note that `advancedTable` blocks do not have an `entity` prop in the BlockNote JSON; the value `"table"` is synthesized by the extraction logic

### 2. Version tracking

Signature changes from `reconcile(document, content_blocks)` to `reconcile(document, version)`:

```ruby
def self.reconcile(document, version)
  new(document).reconcile(version)
end

def reconcile(version)
  content_blocks = version.content_blocks
  # ... extraction and upsert logic uses content_blocks
end
```

When creating a new ObjectReference, set `source_version_id: version.id` and `first_reference_at: version.created_at`. When updating an existing reference (mention still present in a newer version), do NOT overwrite `source_version_id` or `first_reference_at` — this preserves the "first seen in" semantics that MentionsExtractor needs.

The existing `Version#reconcile_object_references` callback must be updated to pass `self` instead of `content_blocks`:

```ruby
def reconcile_object_references
  ObjectReferenceReconciler.reconcile(document, self) if content_blocks.present?
end
```

### 3. Comment reconciliation

New class method:

```ruby
def self.reconcile_comment(comment)
  new(comment.object).reconcile_comment(comment)
end
```

- Extracts references from `comment.content`
- Upserts ObjectReferences with `source = comment.object`, `source_comment_id = comment.id`, `first_reference_at = comment.created_at`
- Cleanup: `ObjectReference.where(source_comment_id: comment.id).where.not(id: extracted_ids).delete_all` — scoped to this comment only, never touches version-sourced references
- No ID namespacing needed — BlockNote regenerates UUIDs on copy-paste (the converter calls `crypto.randomUUID()` for each mention parsed from HTML), so the same mention UUID cannot appear in both a version and a comment
- `current` is always `true` for comment-sourced references

### ObjectComment callbacks

```ruby
after_create  :reconcile_object_references
after_update  :reconcile_object_references
before_destroy :delete_object_references
```

- `reconcile_object_references` calls `ObjectReferenceReconciler.reconcile_comment(self)`
- `delete_object_references` calls `ObjectReference.where(source_comment_id: id).delete_all`

Comments on both Documents and Tables are processed. Table-sourced references will be consumed in a future step.

## MentionsExtractor Replacement

Feature-flagged switch in existing method:

```ruby
def self.get_all_mentions(documents, user)
  if Flipper.enabled?(:object_reference_extractors)
    from_object_references(documents, user)
  else
    from_blocknote(documents, user)
  end
end
```

### `from_object_references` logic

1. Build lookup: `docs_by_id = documents.index_by(&:id)`
2. Query: `ObjectReference.where(target_type: "User", target_id: user.id, source_type: "Document", source_id: docs_by_id.keys)` — both current and non-current
3. For non-current version-sourced refs, batch-load versions by `source_version_id` for path construction
4. Build `Mention` structs:
   - `created_at` = `ref.first_reference_at` (NOT `ref.created_at` — see Schema Changes section)
   - `object_title` = `docs_by_id[ref.source_id].title` (no eager-loading of source)
   - `object_path` — see path logic below
5. Path logic:
   - `current: true` OR `source_comment_id` present → `document_path(doc, anchor: "mention-#{ref.id}")`
   - `current: false` with `source_version_id` → `document_version_path(doc, version, anchor: "mention-#{ref.id}")`

**Note on `user` parameter:** The existing `MentionsExtractor` handles `user.nil?` by returning all user mentions. In practice, callers always pass a non-nil user (`current_user` or `self.user`). The `from_object_references` path assumes `user` is non-nil. If `user.nil?` support is needed later, the query can omit the `target_id` filter.

The `Mention` struct and `EmojiExtractable` interface are unchanged — consumers don't change.

## ReferencesExtractor Replacement

Feature-flagged switch in existing method:

```ruby
def self.all_references(documents)
  if Flipper.enabled?(:object_reference_extractors)
    from_object_references(documents)
  else
    from_blocknote(documents)
  end
end
```

### `from_object_references` logic

1. Build lookup: `docs_by_id = documents.index_by(&:id)`
2. Query: `ObjectReference.where(source_type: "Document", source_id: docs_by_id.keys, current: true, target_type: ["Document", "Table"])`
3. Deduplicate by `[source_id, target_type, target_id]`
4. Build `DocumentReference` structs using `docs_by_id` for `referenced_by`
5. `referenced_path` and `referenced_title` are left nil — `SidebarConnectionsTab#with_link_details` fills them in (unchanged)

**Note on comment-sourced references:** Comment-sourced references have `source_type` set to the parent object type (e.g., "Document") and `current: true`. They are naturally included in the query above — no special handling needed.

The `DocumentReference` struct and `EmojiExtractable` interface are unchanged — `SidebarConnectionsTab` doesn't change.

## Backfill Rake Task

`lib/tasks/object_references.rake` — `rake object_references:backfill`

### Strategy

- Batch size configurable via `ENV["BATCH_SIZE"]` (default: 100)
- Each document wrapped in a transaction (all-or-nothing per document)
- Versions processed oldest → newest so `current` flags end up correct
- Idempotent: same upsert logic as reconciler (create or update by ID)
- Progress logging every N documents

### Pseudocode

```ruby
batch_size = ENV.fetch("BATCH_SIZE", 100).to_i

# Documents: versions + comments
Document.find_each(batch_size: batch_size) do |document|
  ActiveRecord::Base.transaction do
    document.versions.order(sequential_id: :asc).each do |version|
      ObjectReferenceReconciler.reconcile(document, version)
    end

    document.comments.find_each do |comment|
      ObjectReferenceReconciler.reconcile_comment(comment)
    end
  end
end

# Tables: comments only
Table.joins(:comments).distinct.find_each(batch_size: batch_size) do |table|
  ActiveRecord::Base.transaction do
    table.comments.find_each do |comment|
      ObjectReferenceReconciler.reconcile_comment(comment)
    end
  end
end
```

### Idempotency

- Running the task twice produces the same result
- The reconciler creates new references or updates existing ones by ID
- The `current` flag is recomputed based on latest version content
- `source_version_id` preserves "first seen" on update (not overwritten)

## Feature Flag

**Name:** `object_reference_extractors`

### Rollout sequence

1. Deploy code (flag disabled — no behavior change)
2. Run `rake object_references:backfill`
3. Enable: `Flipper.enable(:object_reference_extractors)`
4. Monitor for issues
5. Rollback: `Flipper.disable(:object_reference_extractors)` — instant revert to JSON parsing
6. Once confident: remove old code paths in follow-up

The reconciler runs on every version/comment create regardless of the flag. The flag only controls which read path the extractors use. This means `object_references` stays up to date even while the flag is off.

## Testing

### ObjectReferenceReconciler specs (extended)
- advancedTable block extraction (tableNpi, tableId fallback, blank IDs)
- `source_version_id` set on create, preserved on update
- Comment reconciliation (create, update content, delete)
- `source_comment_id` set for comment-sourced references
- Comments on both Documents and Tables

### MentionsExtractor specs
- Existing specs pass with flag disabled (from_blocknote path)
- New specs for from_object_references path:
  - Returns same Mention structs as JSON parsing
  - Current mentions link to document path
  - Non-current mentions link to version path
  - Comment mentions link to document path
  - Uses documents collection for titles (no extra queries)

### ReferencesExtractor specs
- Existing specs pass with flag disabled (from_blocknote path)
- New specs for from_object_references path:
  - Returns same DocumentReference structs as JSON parsing
  - Only current references returned
  - Only Document/Table target types (not User)
  - Deduplication by (source, target_type, target_id)
  - advancedTable references included

### Rake task specs
- Processes all document versions in order
- Processes document comments
- Processes table comments
- Idempotent (running twice = same result)
- Respects BATCH_SIZE env var
- Handles documents with no versions
- Handles missing targets (broken references)
