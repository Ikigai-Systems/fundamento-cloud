# Imports and `spaces.hierarchy`

## Writing the hierarchy

`spaces.hierarchy` is a JSON column holding a space's whole tree. Concurrent writers (import jobs
above all) doing load → change in Ruby → `save!` lose updates: the last write wins, and the other
document exists, is reachable by URL, but never appears in the sidebar.

**What works: compare-and-swap on `hierarchy_version`, no lock.** Read the tree and its version,
compute the new tree, then write with a column-scoped UPDATE guarded by the version; 0 rows means
someone committed in between, so re-read and retry (then raise `Space::ConcurrentHierarchyUpdate`).

```ruby
Space.where(id: id, hierarchy_version: version)
     .update_all(["hierarchy = ?::json, hierarchy_version = ?, updated_at = ?",
                  updated.to_json, version + 1, Time.current])
```

A plain UPDATE takes `FOR NO KEY UPDATE`, which doesn't conflict with the `FOR KEY SHARE` a
foreign-key insert takes on the space, and it stays inside the caller's transaction. Under READ
COMMITTED a concurrent writer makes it block and then re-check the guard against the new row.

What failed, so it isn't tried again:

- **`Space.lock.find` (`FOR UPDATE`) deadlocks.** `space.documents.create!` already holds
  `FOR KEY SHARE` on the space for the foreign key; asking for `FOR UPDATE` is a lock upgrade, and
  two transactions doing it deadlock.
- **`pg_advisory_xact_lock` across the job transaction wedges imports.** Every job for the space
  contends, the lock spans other advisory locks (versions, GoodJob), and advisory waits are
  invisible to Postgres's deadlock detector, so nothing breaks the cycle.
- **The same advisory lock outside the transaction** removes contention but reopens the window
  between COMMIT and placement, orphaning documents again.
- **Naming the column `lock_version`** turns on Rails optimistic locking for the whole model, so
  unrelated writers (archiving, renaming) start raising `StaleObjectError`. Hence the separate name.
- **A SQL function** wouldn't survive `db:schema:load`, because `schema_format` is `:ruby`.

## Imports are not a sync

`ImportDocumentJob` only creates documents. Re-importing a changed file creates a **duplicate**
(unchanged files are skipped by the `(relative_path, checksum)` check), and link resolution reads
only the current session's `path_map`, so it can't fix links to attachments imported earlier.
Update an imported document through the documents API / `update_document_tool`, using the id from
`import_sessions.path_map`.

For imported documents, version count and last version date say nothing about user edits: early
imports created many versions per document. Use `documents.updated_at`.
