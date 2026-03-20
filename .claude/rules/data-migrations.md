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
