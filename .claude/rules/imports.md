---
paths:
  - "app/models/space.rb"
  - "app/models/import_*.rb"
  - "app/jobs/import_*.rb"
  - "app/controllers/documents_controller.rb"
  - "app/controllers/spaces_controller.rb"
  - "app/services/document_service.rb"
---

# Imports and `spaces.hierarchy`

## Writing the hierarchy

`spaces.hierarchy` is a JSON column holding a space's whole tree, and every writer saves the whole
column. An unserialized load → change → `save!` loses concurrent updates: the other document
exists and is reachable by URL, but never appears in the sidebar.

Never write the column directly. `Space` has two paths, and both bump `hierarchy_version`:

- **Adding a node: `insert_hierarchy_node!(document_id, parent_id:)`.** A compare-and-swap on
  `hierarchy_version` with retries, no lock. Imports, document creation and `DocumentService` use
  it, because it holds nothing across the caller's other work.
- **Any other change (move, remove, re-sort): `with_locked_hierarchy` /
  `Space.with_locked_hierarchies(a, b)`.** Takes `pg_advisory_xact_lock` on the space, re-reads
  it, yields the locked instance (mutate that, not the receiver) and saves. The multi-space form
  locks in id order so opposite moves can't deadlock.

The comments on these methods in `app/models/space.rb` explain why: `FOR UPDATE` deadlocks
against the `FOR KEY SHARE` a document insert takes for the foreign key, and the version bump
keeps a concurrent insert from swapping a locked change away.

Keep the locked block short and don't call it inside a long transaction. `pg_advisory_xact_lock`
is held until the **outermost** transaction ends. Held across a whole import job, it made every
job for the space contend and wedged an import for many minutes; advisory waits are invisible to
Postgres's deadlock detector, so nothing broke the cycle. That is why inserts went to
compare-and-swap. Taking the lock outside the transaction instead reopened the window between
COMMIT and placement and orphaned documents again.

The guard isn't called `lock_version`, because that name turns on Rails optimistic locking for
the whole model, so unrelated writers (archiving, renaming) would start raising
`StaleObjectError`.

## Imports are not a sync

`ImportDocumentJob` only creates documents. Re-importing a changed file creates a **duplicate**
(unchanged files are skipped by the `(relative_path, checksum)` check), and link resolution reads
only the current session's `path_map`, so it can't fix links to attachments imported earlier.
Update an imported document through the documents API / `update_document_tool`, using the id from
`import_sessions.path_map`.

For imported documents, version count and last version date say nothing about user edits: early
imports created many versions per document. Use `documents.updated_at`.
