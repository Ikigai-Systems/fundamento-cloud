# Object Contents — Design Spec

**Date:** 2026-09-09
**Status:** Approved
**Follows:** [#168 command palette performance](https://github.com/Ikigai-Systems/fundamento-cloud/pull/168)

## Problem

`documents.sync` holds the Y.js CRDT blob — the live content of every document — as a
`bytea` column on the `documents` row itself. It was the simple choice when documents were
first built, and it has been quietly spreading cost ever since.

The blob averages 8.7 KB per document (max 281 KB observed; 15.4 MB across 1,761 documents
in the largest development organization). Because `SELECT *` is ActiveRecord's default,
every query that does not explicitly narrow its columns drags the blob along. Defending
against that has leaked into eight places:

- `audited except: [:sync]` — `app/models/document.rb:4`
- an `as_json` override that Base64-encodes the column when present — `app/models/document.rb:63-69`
- `:except => [:sync]` in three spots — `app/controllers/documents_controller.rb:26,75,109`
- four defensive narrow selects — `app/blueprints/space_blueprint.rb:22`,
  `app/components/object/sidebar_connections_tab.rb:37,41`,
  `app/controllers/documents_controller.rb:23`
- `SpaceSidebarTree::SELECTED_COLUMNS` and `HasIcon::COLUMNS` exist partly so those selects
  are repeatable without forgetting a column

The defence is not reliable. It has already failed twice:

1. `SearchesController#show` loaded every blob in the organization on each keystroke —
   15.4 MB per request, 1,386 ms of it garbage collection. Fixed in #168 by narrowing the
   select.
2. `documents_controller.rb:26` still does it today: `GET /d.json` renders
   `render json: policy_scope(current_organization.documents), :except => [:sync]`, which
   reads every blob out of the database and then discards it at serialization time.

### Write churn

A second cost, less obvious. `DocumentChannel#save_doc` performs
`document.update(sync: update.pack("C*"))` on essentially every edit. Two consequences,
both measured:

- The write bumps `documents.updated_at`, so the `documents` row is rewritten on every
  keystroke.
- A changed TOASTed value cannot use a HOT update, so each write rewrites the row *and*
  its TOAST chain, accumulating dead tuples on the main heap.

That churn lands on the same table the command palette now scans on every search.

### Why Postgres has not already solved this

`documents.sync` has `attstorage = 'x'` (EXTENDED), so values over ~2 KB already live
out-of-line in a TOAST heap — 744 kB main heap versus 8,936 kB TOAST locally. A query that
names its columns never reads that TOAST heap. **This design is therefore not a read-path
optimization**: a correctly written query is already fast, and `WHERE organization_id = ?
AND title ILIKE ?` measured 0.789 ms with no index at all.

What it buys is *correct by default* — the blob stops being reachable from `documents` at
all, so no future query can pull it in by accident — plus isolating the write churn.

## Goal

Move document content into a dedicated table shaped so that table content can later join
it, without a second migration.

## Direction this serves

Table content today lives in `tables/rows`, `tables/columns` and `tables/cells`, which is
more machinery than the problem needs; storing it as JSON in the database is under
consideration. Table *versions* already go to S3, while live content stays in Postgres.
The end state under consideration is a single object store — or two tables of near-identical
shape — covering both documents and tables.

`object_contents` is that seam. Documents populate `sync`; tables would later populate
`data` in the same row shape. Whether the two ever merge into one `objects` table is a
later decision, made with real information; this design neither forces nor blocks it.

## Schema

```ruby
create_table :object_contents do |t|          # plain bigint PK, never appears in a URL
  t.string :owner_type, null: false
  t.string :owner_id,   null: false
  t.binary :sync                              # documents: the Y.js CRDT
  t.jsonb  :data                              # tables, later
  t.timestamps
  t.index [:owner_type, :owner_id], unique: true
end
```

**Primary key.** A plain bigint, following `object_visitors` (`db/schema.rb:471`) — the
existing precedent for a non-URL-facing polymorphic table. The nanoid convention in
CLAUDE.md exists for clean URLs; this row never appears in one.

**The unique index** is what makes the relationship 1:1 and provides the lookup's access
path.

**No `organization_id`.** It is derivable through the owner and nothing would query content
by tenant. Easy to add later, hard to remove.

**Both content columns nullable.** A row populates exactly one of `sync` / `data`, but a
`CHECK` constraint enforcing that would need revisiting when tables arrive with their own
rules. Left out deliberately.

## Models

```ruby
class ObjectContent < ApplicationRecord
  audited enabled: false
  belongs_to :owner, polymorphic: true, touch: true
end
```

`audited enabled: false` follows `ObjectVisitor` — auditing a blob rewritten on every
keystroke would be pure cost.

```ruby
class Document < ApplicationRecord
  has_one :content, -> { where(owner_type: "Document") },
          class_name: "ObjectContent", as: :owner, dependent: :destroy
end
```

### `touch: true` is load-bearing

Once `sync` leaves `documents`, content writes no longer touch `documents.updated_at`, and
two live surfaces read it:

- `Document.recently_updated` (`app/models/document.rb:47`), rendered by
  `RootController#recently_updated` into the dashboard's `#recently_updated_frame`, with a
  Turbo broadcast on save
- `TitleSearch#matching_title`'s recency tiebreak (`app/models/concerns/title_search.rb:43`)

Without `touch: true`, `documents.updated_at` would silently come to mean "title or icon
changed" and both surfaces would stop reflecting edits. With it, behaviour is identical to
today and no reading code changes.

The touch is cheap: `updated_at` is not indexed on `documents`, so it is a HOT update. The
expensive part — rewriting an 8.7 KB blob and its TOAST chain — moves to `object_contents`.

## Interface

Call sites access content explicitly — `document.content.sync`,
`document.content.update!(sync: ...)`. No delegating `Document#sync`.

A delegator would have kept the diff smaller, but it would also have kept the storage
boundary invisible at exactly the moment the codebase is growing a second content type.
Explicit access reads correctly when tables join the same store.

## Cutover — two releases

**R1** creates the table, backfills, and switches reads and writes together.
**R2** drops `documents.sync`.

### The loss window, stated plainly

During R1's rollout, a draining container on the previous release still writes to
`documents.sync`, which nothing reads any more. Those edits are lost.

This is an accepted trade, not an oversight. The alternative — write-both deployed
everywhere before reads switch — costs a third release. Two mitigations make the exposure
smaller than it sounds:

- The window only affects documents being *actively edited* during the rollout.
- `DocumentChannel` holds Y.js state client-side, so an affected user's next keystroke
  rewrites the whole document.

It is not zero. Deploy R1 at a quiet hour.

### R1 migration

Production is under ~1 GB, so a batched backfill inside the migration is acceptable —
seconds to a couple of minutes, and self-hosted `db:prepare` on boot will not stall
noticeably.

Per `.claude/rules/data-migrations.md` this is a Tier 2 data migration: `def up` / `def down`,
and **idempotent**, so a retried self-hosted boot cannot duplicate rows:

```ruby
INSERT INTO object_contents (owner_type, owner_id, sync, created_at, updated_at)
SELECT 'Document', d.id, d.sync, d.created_at, d.updated_at
FROM documents d
WHERE d.sync IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM object_contents c
    WHERE c.owner_type = 'Document' AND c.owner_id = d.id
  )
```

Batched by primary key so a large table does not build one enormous transaction. Carrying
`documents.updated_at` across preserves the recency ordering for documents nobody has
edited since.

## Call sites

Twelve, all switching to `document.content`:

| Location | Note |
|---|---|
| `app/channels/document_channel.rb:71,82` | `#load_doc` / `#save_doc` — the hot path |
| `app/services/document_service.rb:42,77,124` | three `update!(sync:)` |
| `app/jobs/import_document_job.rb:50` | |
| `app/jobs/import_session_orchestrator_job.rb:71` | |
| `app/jobs/import_link_resolution_job.rb:101` | |
| `app/models/document.rb:79` | `#to_blocks` |
| `db/seeds/setup/documents.rb:98` | |

Two need more than a rename:

- **`Space#create_onboarding_document` (`app/models/space.rb:328`) and
  `#create_home_document!` (`:419`)** pass `sync:` straight into `documents.create!`.
  They become create-then-build-content.
- **`lib/wiki_link_repair.rb:66`** — `Document.where.not(sync: nil)` is the only query
  filtering on the column. It becomes a join through `object_contents`.

## What this removes

- `Document#as_json`'s Base64 override — dead once `sync` is not a Document column
- `audited except: [:sync]` on `Document`
- all three `:except => [:sync]` in `documents_controller`
- **the `GET /d.json` blob bug fixes itself** — `render json: policy_scope(...)` stops
  reading 15 MB, because there is no blob on the row to read

The four defensive narrow selects can be revisited afterwards; several become unnecessary.
That is cleanup, not part of this change.

## Testing

- **`spec/models/object_content_spec.rb`** — `touch: true` propagates to the owner's
  `updated_at`; `dependent: :destroy` removes content with its document; the unique index
  rejects a second row for one owner.
- **`spec/migrations/`** — the backfill copies `sync` and timestamps; is idempotent when
  re-run; skips documents with a null `sync`.
- **A no-blob guard**, mirroring the assertion that caught the palette regression
  (`spec/services/space_sidebar_tree_spec.rb:114-128`): a `Document` query must not mention
  `object_contents` unless content was explicitly requested.
- **`DocumentChannel`** — an edit still bumps `documents.updated_at`, so
  `Document.recently_updated` ordering is unchanged. This is the regression test for the
  one behaviour that could silently drift.
- The existing suite covers the twelve call sites; `bin/dev-e2e` covers live editing.

## Open questions

None blocking. Two noted for later:

- Whether `object_contents` and a future `objects` table merge, or stay as two tables of
  the same shape. Deferred until table content actually moves to JSON.
- Whether the four defensive narrow selects should be relaxed once the blob is gone.
