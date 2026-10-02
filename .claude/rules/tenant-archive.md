# Tenant archives, trash, and restore

The facts here are expensive to rediscover, and nearly all of them were found by running code
against real data rather than by reading it.

## Every restorable table needs a key a restore can match — and it must not be its own `id`

A restore has to answer "is this archived row already in the database?" For string primary keys
the id answers it — nanoids are preserved, which is the whole reason merge-back is cheap. For
integer primary keys it cannot: they come from sequences shared across every tenant and are
reassigned on insert, so the archived id says nothing. Matching has to go through a key whose
columns the archive preserves.

**The rule for anything new:** a table a restore must match needs either a string primary key or
a declared unique index over columns the export keeps. A key containing the table's own `id` is
not one of those, because `id` is reassigned on the way in — which rules out the tempting
one-liner of making an existing `[parent_id, id]` index unique.

`Tenant::RestorePlanner` returns no matcher for a table that has neither, and
`Tenant::RestoreService` then **skips it and reports it** rather than inserting. No exported
table is in that position today, and `spec/services/tenant/round_trip_spec.rb` fails if one
ever is. The guard stays anyway: the failure mode is silent duplication, not an error.

### What this cost to find out

Eight tables used to have no usable key — five with no unique index at all
(`table_change_events`, `object_comments`, `pack_versions`, `automation_invocations`,
`attachments`) and three whose only unique key *is* the secret the export deliberately drops
(`api_tokens`, `oauth_access_grants`, `oauth_access_tokens`).

The service used to insert them regardless, and restoring one deleted document duplicated six
comments and fifteen change events that had never gone away. The fixtures had no comments, so no
test caught it — only a smoke test against seeded data did. **That is still the lesson: these
paths are only honestly exercised against realistic data.**

Each was then given an identity, and which one depended on whether a natural key already
existed:

- `pack_versions` already had one. `PackVersion#set_version_number` assigns `version` as a
  per-pack counter under an advisory lock, so `(pack_id, version)` was a natural key that had
  simply never been declared. An index was the whole fix.
- `table_change_events` earned one — a per-table `sequential_id`, assigned like
  `Version`'s and `Tables::Version`'s. This also fixed an ordering bug: `chronological` sorted
  by `id`, so a restored event, reassigned a fresh id, sorted last however old it was. The
  advisory lock additionally serialises appends to one table's log, which
  `Tables::ChangeRecorder#coalescable_event` already assumed when it called the row it found
  "strictly the immediately preceding event".
- The other six took string primary keys. `object_comments` could have taken a counter, and
  did not, because `object_references.source_comment_id` is an integer reference with **no
  foreign key behind it** — the hazard described under `Tenant::IdMap` below. A string key
  retires the column; a counter would have left it standing.

**Scoping a restore to a subtree was the planned fix and is no longer needed for this.** It
would have made the eight safe by narrowing what is in play. Giving them real identities was
cheaper and fixes them everywhere, so scoping is now a convenience rather than a correctness
requirement.

### Three referencing columns that no schema reveals

Changing those primary keys meant rewriting every column holding one, and the dangerous ones are
invisible in `db/schema.rb` because none is a foreign key. Audit these whenever a primary key
type changes:

- `active_storage_attachments.record_id` — polymorphic, already a string, holding the integer
  stringified. `Attachment` and `PackVersion` both `has_one_attached`.
- `object_reactions.object_id` — polymorphic and already a string.
  `ObjectReaction::ALLOWED_OBJECT_TYPES` includes `ObjectComment`, so comments carry reactions;
  only the model says so.
- `audits.auditable_id` / `associated_id` — `audited` is declared on `ApplicationRecord`, so
  every model is audited unless it calls `skip_auditing`. Missing these points a model's whole
  audit trail at ids that no longer exist.

### Doorkeeper's tables cannot generate their own ids

`Doorkeeper::AccessToken` and `AccessGrant` inherit from `::ActiveRecord::Base`, not this app's
`ApplicationRecord`, so `generate_id_if_needed` never runs and a string `id` would fail `NOT
NULL` on every insert — every OAuth sign-in. Their `id` columns therefore keep a
`gen_random_uuid()` database default, which is the one place that default is deliberate.
Patching the gem's classes is the alternative, and Doorkeeper 5.9.3 deliberately no-ops its own
`run_hooks` because of a re-entrant `ApplicationRecord` autoload (its comment cites issue
#1828), so the database is the safer place for it.

## `Space#documents` and `Space#tables` must never be scoped

```ruby
# space.rb — this shape is deliberate
has_many :documents,     -> { kept }, dependent: nil,                 inverse_of: :space
has_many :all_documents, class_name: "Document", dependent: :destroy, inverse_of: :space
```

`dependent:` only destroys what its association's scope selects
([rails/rails#22201](https://github.com/rails/rails/issues/22201)). Putting the cascade on the
`-> { kept }` association would make it skip trashed children, orphaning them with dangling
foreign keys whenever a space or organization is purged.

So the cascade lives on `all_documents` / `all_tables`, and the scoped pair carries
`dependent: nil` explicitly — stated rather than omitted, so the next reader knows it is a
decision.

`User#organizations` *is* scoped, and safely, because it is a `has_many :through` with no
`dependent:`. The difference is the cascade, not the pattern.

Policies keep an explicit `.kept` because `policy_scope(Document)` is sometimes handed the
class rather than an association, where no association scope applies.

## Every `before_destroy` on a trashable model is a latent bug

Trashing runs none of them. Audit them whenever `Trashable` is added to a model.

`Document` had two, and both were live user-facing faults:

- `nullify_space_home_document_id` — the pointer survived, so `SpacesController#show`
  redirected to a trashed document. Trash a space's home document and visiting the space
  404s, with no way into your own space. Now guarded with `kept?`.
- `nullify_object_reference_targets` — the target survived (correctly, so untrashing restores
  the connection), but `SidebarConnectionsTab` loaded it with `find_by_param!`, which
  **raises**. The whole connections tab went down for any document that merely mentioned
  something deleted. Now drops references it cannot resolve.

The pattern for both: keep the pointer so untrashing works, and cope at render time — which
is what the hierarchy renderers already did.

## Lists that fail silently have coverage specs

`Tenant::TableRegistry.all_declared`, `TrashPurgeJob::PURGEABLE`,
`Tenant::RestoreOrder::TABLES`, `Tenant::IdMap::REMAPPED`,
`Tenant::TableRegistry::UNCONSTRAINED`.

If any of these drifts the result is silence, not failure: a table missing from every archive,
trash that never expires, a restore that quietly omits a table. Each has a spec that fails
when reality outgrows the list, and each was verified by breaking it deliberately.

Two of them exist specifically because the database cannot verify the content:

- `TableRegistry::UNCONSTRAINED` — derived rules whose column has no foreign key, so no spec
  can confirm the parent. The plan had the OAuth tables reaching the tenant through
  `resource_owner_id`; production says that column points at **users** (372 of 372 tokens),
  and the real link is `organization_membership_id`. An export built on the wrong one would
  have contained zero OAuth records and said nothing.
- `IdMap::REMAPPED` — four columns referring to reassigned integer ids, of which only three are
  foreign keys. `object_references.source_version_id` is unconstrained, so a schema-derived
  list misses it, and leaving it unmapped attaches a mention to whatever row now holds that
  number — possibly another tenant's. It was six: giving `object_comments` and `pack_versions`
  string keys retired two entries. `id_map_spec.rb` fails on an entry whose target no longer
  reassigns its ids, so a retirement cannot be forgotten — it caught both of these.

Adding to either list is meant to require writing down why.

## Reflection belongs in specs, not production code

`TrashPurgeJob` briefly discovered its models with `Rails.application.eager_load!` plus
`ApplicationRecord.descendants`. Needing `eager_load!` inside a job was the signal: the thing
being solved was *completeness*, which is a property a test can assert. The job names its
models; a spec walks the `Trashable` includers and fails if the list has fallen behind.
