# Data Migrations

The self-hosted standalone version runs `db:prepare` on boot — anything in `db/migrate/` runs automatically, rake tasks don't. All data changes that self-hosted customers need must be migrations, not rake tasks.

## Tier 1: Schema + small inline data (preferred)

Use `reversible` or `up_only` inside `def change` when a data backfill is fast and tightly coupled to a schema change.

```ruby
def change
  add_column :things, :new_field, :string

  reversible do |dir|
    dir.up do
      execute "UPDATE things SET new_field = old_field"
    end
  end
end
```

`up_only` is shorthand when no rollback action is needed:

```ruby
def change
  add_column :things, :new_field, :string
  up_only { execute "UPDATE things SET new_field = old_field" }
end
```

## Tier 2: Data-only migration

For larger backfills that don't change the schema. Use `def up`/`def down` (not `def change`).

```ruby
class BackfillThingCategories < ActiveRecord::Migration[8.1]
  def up
    # Must be idempotent — safe to run if partially completed
    Thing.where(category: nil).find_each(batch_size: 500) do |thing|
      thing.update_column(:category, derive_category(thing))
    end
  end

  def down
    # optional: no-op or cleanup
  end
end
```

## Tier 3: Rake tasks (managed deployments only)

Only for one-off fixes on deployments where you can SSH in. Never the primary mechanism for data changes — self-hosted customers won't run them.

## Model references in migrations

- Prefer raw SQL (`execute "UPDATE ..."`) for simple data changes
- When Ruby logic is needed (batch processing, complex transforms), reference models but accept that old migrations may not re-run from scratch — `db:schema:load` handles fresh databases, migrations only run forward

## Removing a column takes two releases

The hosted cloud rolls containers, so one still running the old code breaks the moment a column
disappears (see "Deployment" in `CLAUDE.md`).

**Release 1, stop using it:**
- `self.ignored_columns += %w[col]` on the model
- move every read and write off it
- **relax `NOT NULL` if the column has it.** This is the step that's easy to miss: with
  `ignored_columns` set, Rails leaves the column out of `INSERT`s, so a `NOT NULL` column with no
  default rejects every record creation and every fixture load.

**Release 2:** `remove_column` / `remove_reference`, then delete the `ignored_columns` line and any
defences that existed only to hide the column (`audited except:`, `as_json` overrides,
`:except => [...]` in controllers). Keep those through release 1 in case it's rolled back while the
column still exists.

`ignored_columns` does real work: it turns a missed call site into a `NoMethodError` instead of a
silent read of stale data, and caught four spec assertions during the `documents.sync` move.

**Run the chain from zero** on a scratch database (`db:create` + `db:migrate` with a `DATABASE_URL`
override) whenever one migration backfills from a column a later one drops. Timestamp order has to
put the backfill first, and only a from-zero run proves it.
