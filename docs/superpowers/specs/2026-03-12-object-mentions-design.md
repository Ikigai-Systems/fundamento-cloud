# Object Mentions: Broken Link Handling & Link Tracking Layer

## Problem

When importing documents (especially from Obsidian vaults), wiki links that can't be resolved are converted to strikethrough markdown markers (`~~[[text]]~~{.broken_link}`). These render as plain strikethrough text with no structured data — they can't be queried, fixed, or tracked.

Additionally, there is no persistent link tracking between objects. Links exist only as inline content in BlockNote JSON. Deleting a document silently breaks all mentions of it in other documents. The `MentionsExtractor` service extracts mentions on the fly by scanning BlockNote JSON, which is unoptimized for displaying link graphs.

## Solution

Introduce an `object_mentions` persistence layer that tracks all mention relationships between objects. Each BlockNote mention inline content node maps 1:1 to an `object_mentions` row. The mention node stores the `object_mention` ID (via its existing `props.id`), and the component reads link state from the DB rather than fetching the target entity directly.

Broken links are represented as `object_mentions` with `target_id: NULL` — no special flags needed. Fixing a broken link in the future means populating `target_id` on the `object_mention` row, with zero document content changes.

## Scope

**In scope:**
- `object_mentions` table and model
- Reconciliation on version creation (synchronous)
- Deletion hooks on Document and Table (target nullification + source cleanup)
- Import pipeline: produce mention nodes for wiki links (resolved and broken)
- BlockNote converter: custom parse/serialize handlers for mention spans
- Mention component: batch-load from `object_mentions`, render broken state
- API endpoint for batch loading
- Backward compatibility with unmigrated documents
- Tests for all layers

**Out of scope (future work):**
- "Fix broken link" UI (click to create page or relink)
- Deletion warning UI (list of documents referencing the one being deleted)
- Migration of existing documents to backfill `object_mentions`
- Refactoring `MentionsExtractor` to use `object_mentions`
- Backlinks UI (list of documents that link to this one)

## Design

### 1. `object_mentions` Table

```
object_mentions:
  id                string    PK, = mention node props.id (UUID, NOT auto-generated NPI)
  source_type       string    NOT NULL, polymorphic: "Document"
  source_id         string    NOT NULL, NPI of containing document
  target_type       string    NOT NULL: "Document", "Table", "User"
  target_id         string    nullable: NPI/ID of target, NULL = broken
  title             string    NOT NULL, display title, preserved when target deleted
  current           boolean   NOT NULL, default: true, false = only in old versions
  organization_id   string    NOT NULL, scoping for queries
  created_at        datetime
  updated_at        datetime

Indexes:
  (source_type, source_id)          — "all mentions in this document"
  (target_type, target_id)          — "what links to this object?" (backlinks)
  (organization_id)                 — org-scoped queries
```

**Key behaviors:**
- `broken?` = `target_id.nil?`
- `target_type` is NOT NULL — always set, even for broken links (tells you what kind of object was referenced)
- Only `target_id` is nullable — NULL means the link is broken
- `id` is a UUID from the mention node's `props.id`, NOT an auto-generated NPI. The `ObjectMention` model must skip the default Nanoid generation (`generate_id_if_needed`) and accept the UUID as-is. The `id` column must accommodate 36-character UUIDs.
- One row per mention node (not per unique source→target pair) — matches `MentionsExtractor` semantics
- All versions sharing the same mention node share the same `object_mention` row
- `current: true` means the mention exists in the latest document content
- `current: false` means it only exists in old versions (never deleted, since versions are immutable)

### 2. ObjectMention Model

`app/models/object_mention.rb`

- `belongs_to :source, polymorphic: true`
- Manual target lookup (not a Rails polymorphic association since `target_id` can be null)
- `belongs_to :organization`
- Skips default NPI generation — `id` is set explicitly from the mention node's `props.id` UUID
- Scopes: `current`, `broken`, `for_source(source)`, `pointing_to(target_type, target_id)`
- Method: `broken?` — `target_id.nil?`
- Source document association includes `dependent: :delete_all` on the Document side, so deleting a source document cleans up its `object_mentions`

### 3. BlockNote Mention Node

The existing `mention` inline content spec is unchanged:

```typescript
propSchema: {
  id:       { default: "" },       // UUID — correlation key to object_mentions.id
  entity:   { default: "document" },
  entityId: { default: -1 },
  title:    { default: "Untitled" },
}
```

No new props. `entityId` is kept for backward compatibility with unmigrated documents.

**New: Parse and serialize handlers** must be added to the mention inline content spec in both `strippedSchema.tsx` (server-side converter) and the client-side schema:

- **`parseHTML`**: Recognizes `<span data-mention="...">` elements and extracts `entity`, `entityId`, and `title` from data attributes and text content. Generates a UUID for `id`.
- **`toExternalHTML`**: Serializes mention nodes back to `<span data-mention="..." data-entity-id="...">title</span>` for the export path, ensuring round-trip fidelity (blocks → markdown → blocks).

### 4. Mention Component Changes

`app/javascript/components/editor/inline-content/MentionInlineContent.tsx`

**New data flow:**
1. When editor loads, fetch `GET /api/v1/documents/:id/object_mentions` — cached in React Query
2. Each mention component reads from this cache using its `props.id`
3. If `object_mention` found and `target_id` is not null → render as working link (use `target_id` for navigation)
4. If `object_mention` found and `target_id` is null → render broken state
5. If no `object_mention` found (unmigrated document, or mention added but version not yet saved) → fall back to current behavior (fetch entity directly by `entityId`)

**Broken state rendering:**
- Red text color
- Solid red border
- Strikethrough
- Subtle red background
- CSS class: `.mention--broken`

**Applies to all entity types:** DocumentMention, TableMention, UserMention all read from the `object_mentions` cache.

**Note on user-created mentions:** When a user inserts a mention via the `@`-picker in the editor, the mention node is created client-side with a UUID `id`. The `object_mention` row is only created when a version is saved (reconciliation). Until then, the component falls back to the `entityId` direct-fetch path. This is expected and documented behavior.

### 5. Reconciliation on Version Creation

`app/services/object_mention_reconciler.rb`

**Triggered by:** `Version` `after_create` callback (synchronous, alongside existing `broadcast_mentions_updated`).

This is synchronous for simplicity. If performance becomes an issue with very large documents, it can be moved to an async job in a future iteration.

**Algorithm:**
1. Walk `content_blocks` JSON recursively (same traversal pattern as `MentionsExtractor.each_mention`)
2. Collect all mention nodes — extract `id`, `entity`, `entityId`, `title`
3. Skip mention nodes with empty/missing `id` (legacy data) or `entityId` of `-1` (uninitialized)
4. Batch-fetch existing targets: collect unique `(target_type, target_id)` pairs, query each type in one batch (e.g., `Document.where(id: doc_ids).pluck(:id).to_set`, `Table.where(id: table_ids).pluck(:id).to_set`, `User.where(id: user_ids).pluck(:id).to_set`)
5. For each mention node:
   - Map `entity` to `target_type`: `"document"` → `"Document"`, `"table"` → `"Table"`, `"user"` → `"User"`
   - Determine `target_id`: use `entityId` if the target exists in the batch-fetched set; otherwise `NULL`
   - Determine `title`: if target exists, fetch its display name (document title, table name, user full name) from the batch; otherwise use the mention node's `title` prop
   - If `object_mention` with that `id` exists → update `current: true`, update `title` if changed
   - If new → create `object_mention` with source, target_type, target_id, title, organization_id
6. All `object_mentions` for this source document whose `id` is NOT in the extracted set → set `current: false`

**entityId type handling:**
- `entityId` can be a string (NPI for documents/tables), a number (legacy user IDs), or empty string / `-1` (uninitialized/broken)
- Empty string `""` from import broken links → `target_id: NULL`
- `-1` (default/uninitialized) → skip the mention node
- Numeric values → convert to appropriate type for User lookup
- String values → use directly for Document/Table lookup

### 6. Deletion Hooks

**Target deletion — nullify `target_id`:**

Document model (`app/models/document.rb`):
```ruby
before_destroy :nullify_object_mention_targets

def nullify_object_mention_targets
  ObjectMention.where(target_type: "Document", target_id: id, organization_id: organization_id)
               .update_all(target_id: nil)
end
```

Table model (`app/models/table.rb`):
```ruby
before_destroy :nullify_object_mention_targets

def nullify_object_mention_targets
  ObjectMention.where(target_type: "Table", target_id: id, organization_id: organization_id)
               .update_all(target_id: nil)
end
```

Title is already stored in the `object_mention` row — no update needed on deletion. `target_type` is preserved (non-null) to indicate what kind of object was referenced.

User mentions: not handled (organization memberships are not removable). Trivial to add later if needed.

**Source deletion — clean up `object_mentions`:**

Document model (`app/models/document.rb`):
```ruby
has_many :source_object_mentions, class_name: "ObjectMention", as: :source, dependent: :delete_all
```

When a source document is deleted, all its `object_mentions` are deleted. These are no longer needed since the document and all its versions are gone.

### 7. Import Pipeline Changes

#### ImportLinkResolutionJob

**Current behavior:** Replaces `[[wiki links]]` in original markdown with:
- Resolved: `[text](/d/npi)` (becomes regular HTML link → styled text in BlockNote)
- Broken: `~~[[text]]~~{.broken_link ...}` (becomes strikethrough text in BlockNote)

**New behavior:** Replaces `[[wiki links]]` with HTML spans that the converter recognizes:
- Resolved: `<span data-mention="document" data-entity-id="doc_npi">Display Text</span>`
- Broken: `<span data-mention="document" data-entity-id="">Original Title</span>`

The `data-mention` attribute maps to the `entity` prop, `data-entity-id` maps to `entityId`, and the element's text content maps to `title`.

The resolved markdown is then converted to blocks via `BlocknoteConverterService.markdown_to_blocks`, which produces proper mention nodes thanks to the new `parseHTML` handler on the mention inline content spec.

Version creation triggers reconciliation, which creates `object_mentions` for all mentions (including broken ones with `target_id: NULL`).

**Note on heading anchors:** `[[target#heading]]` links currently resolve to `/d/npi#heading`. In the new system, heading anchor support is deferred — the mention links to the document without the anchor. This can be added later as a prop on the mention node or as metadata on `object_mentions`.

#### Blocknote Converter (`micro-services/blocknote-converter/src/converters.ts`)

The mention inline content spec in `strippedSchema.tsx` needs a `parseHTML` handler:

```typescript
// In the mention inline content spec:
parse: [{
  tag: "span[data-mention]",
  getAttrs: (element) => ({
    id: crypto.randomUUID(),
    entity: element.getAttribute("data-mention"),
    entityId: element.getAttribute("data-entity-id") || "",
    title: element.textContent || "Untitled",
  }),
}]
```

And a corresponding `toExternalHTML` handler for serialization:

```typescript
// Produces: <span data-mention="document" data-entity-id="npi">Title</span>
toExternalHTML: (props) => {
  const span = document.createElement("span");
  span.setAttribute("data-mention", props.entity);
  span.setAttribute("data-entity-id", props.entityId?.toString() || "");
  span.textContent = props.title;
  return { dom: span };
}
```

This ensures:
- Import: `<span data-mention>` HTML → mention nodes (via `parseHTML`)
- Export: mention nodes → `<span data-mention>` HTML → preservable in markdown (via `toExternalHTML`)
- Round-trip fidelity for blocks → markdown → blocks

**Note:** The exact BlockNote API for `parseHTML` and `toExternalHTML` on inline content specs should be verified against the version of BlockNote used in this project. The implementation may need to adapt to the specific API surface.

### 8. API Endpoint

`GET /api/v1/documents/:document_id/object_mentions`

**Controller:** `Api::V1::ObjectMentionsController`

**Authorization:** User must have read access to the source document (reuse existing document policy).

**Filtering:** Returns only `current: true` mentions by default. The editor only needs active mentions; historical ones (in old versions only) are not relevant for rendering.

**Response:**
```json
{
  "object_mentions": [
    {
      "id": "uuid-mention-node-id",
      "target_type": "Document",
      "target_id": "doc_xyz",
      "title": "Project Plan"
    },
    {
      "id": "uuid-broken-mention",
      "target_type": "Document",
      "target_id": null,
      "title": "Missing Doc"
    }
  ]
}
```

**Routing:** Nested under documents in the API namespace.

**Note:** Only documents are sources in this round. The polymorphic `source_type` supports future expansion to tables, but no `/tables/:id/object_mentions` endpoint is needed yet.

### 9. Backward Compatibility

- Mention nodes retain `entityId` prop — all existing rendering logic, `MentionsExtractor`, and navigation continues to work unchanged
- The mention component checks for `object_mention` data first, falls back to direct entity fetch by `entityId` when no `object_mention` exists
- No migration of existing documents required for this round — `object_mentions` build up organically as documents are saved/imported going forward
- `MentionsExtractor` is untouched — it continues to work with `entityId` directly
- Existing broken link markers (`~~[[text]]~~{.broken_link}`) in previously imported documents remain as-is (strikethrough text). Only new imports produce mention nodes. Migration of old broken markers is out of scope.

### 10. Tests

#### Model Tests (`spec/models/object_mention_spec.rb`)
- Validates required fields (source, target_type, title, organization)
- `broken?` returns true when `target_id` is nil
- `broken?` returns false when `target_id` is present
- Scopes: `current`, `broken`, `for_source`, `pointing_to`
- Uses UUID for id (not auto-generated NPI)

#### Reconciler Tests (`spec/services/object_mention_reconciler_spec.rb`)
- Creates `object_mentions` for new mention nodes in content_blocks
- Updates existing `object_mention` to `current: true` when still present
- Sets `current: false` for mentions removed from latest version
- Handles mention with `entityId` pointing to nonexistent document (creates as broken)
- Handles mention with `entityId` pointing to nonexistent table (creates as broken)
- Handles mention with `entityId` pointing to nonexistent user (creates as broken)
- Updates title from target object when target exists
- Preserves title from mention node when target doesn't exist
- Skips mention nodes with empty/missing `id`
- Skips mention nodes with `entityId` of `-1` (uninitialized)
- Idempotent — running twice with same content produces same result
- Batch-fetches targets efficiently (not N+1)

#### Deletion Hook Tests
- **Document deletion** (`spec/models/document_spec.rb`):
  - Nullifies `target_id` on `object_mentions` pointing to deleted document
  - Preserves `target_type` and `title` on nullified mentions
  - Deletes `object_mentions` where the deleted document is the source (via `dependent: :delete_all`)
- **Table deletion** (`spec/models/table_spec.rb`):
  - Nullifies `target_id` on `object_mentions` pointing to deleted table
  - Preserves `target_type` and `title`

#### Import Pipeline Tests (`spec/jobs/import_link_resolution_job_spec.rb`)
- Resolved wiki link produces `<span data-mention>` with entity ID in markdown output
- Broken wiki link produces `<span data-mention>` with empty entity ID
- Alias text used as display text in span content
- After full pipeline (resolve → convert → version create → reconcile): resolved link has `object_mention` with valid target
- After full pipeline: broken link has `object_mention` with `target_id: NULL` and original title preserved

#### Converter Tests (`micro-services/blocknote-converter/`)
- `<span data-mention="document" data-entity-id="npi">` converts to mention node with correct props
- `<span data-mention="document" data-entity-id="">` converts to mention node with empty entityId
- Regular `<a href="/d/npi">` links are NOT converted to mentions (backward compat)
- Mention nodes serialize to `<span data-mention>` HTML via `toExternalHTML`
- Mention nodes round-trip: blocks → HTML → blocks preserves mention structure

#### API Tests (`spec/requests/api/v1/object_mentions_controller_spec.rb`)
- Returns current `object_mentions` for a document
- Includes broken mentions (target_id null) in response
- Excludes non-current mentions (current: false)
- Requires authentication
- Requires read access to the document (Pundit policy)
- Returns empty array for document with no mentions

#### Version Callback Integration Tests
- Creating a version triggers reconciliation
- `object_mentions` are created for all mention types (document, table, user)
- `current` flag is correctly toggled across version creates
