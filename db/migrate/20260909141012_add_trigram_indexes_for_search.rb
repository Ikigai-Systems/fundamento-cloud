class AddTrigramIndexesForSearch < ActiveRecord::Migration[8.1]
  # Two reasons, both required. CREATE INDEX CONCURRENTLY cannot run inside a transaction,
  # and a failed statement aborts the surrounding transaction -- which would turn the
  # rescue below into "current transaction is aborted" for every statement after it.
  disable_ddl_transaction!

  # The command palette searches these with ILIKE '%term%'. Bounded by organization_id a
  # sequential scan is already fast (0.8ms over ~1800 rows), so these indexes are insurance
  # for the shared multi-tenant tables as they grow, not the thing that makes search quick.
  INDEXES = {
    documents: :title,
    tables: :name,
    spaces: :name,
  }.freeze

  def up
    unless enable("pg_trgm")
      say "Skipping trigram search indexes. Palette search still works via a sequential " \
          "scan; an operator with rights can CREATE EXTENSION pg_trgm and re-run this."
      return
    end

    tenant_scoped = enable("btree_gin")

    INDEXES.each do |table, column|
      drop_invalid_index(index_name(table))

      # btree_gin supplies the GIN opclass for the equality key, letting the index bound by
      # tenant before doing any trigram work. Without it a column-only trigram index still
      # helps, it just cannot AND the organization in.
      columns = tenant_scoped ? [:organization_id, column] : column

      add_index table, columns,
        using: :gin,
        opclass: {column => :gin_trgm_ops},
        name: index_name(table),
        algorithm: :concurrently,
        if_not_exists: true
    end
  end

  def down
    INDEXES.each_key do |table|
      remove_index table, name: index_name(table), algorithm: :concurrently, if_exists: true
    end

    # The extensions stay: something else may have come to depend on them.
  end

  private

  def index_name(table)
    "index_#{table}_on_organization_and_search_term_trgm"
  end

  # Self-hosted runs db:prepare on boot with whatever database user the operator configured.
  # pg_trgm and btree_gin are trusted on PG13+, so any user with CREATE on the database can
  # install them -- but a locked-down managed Postgres may still refuse, and a missing index
  # is a slower search where a raised migration is a container that will not start.
  def enable(name)
    return true if extension_enabled?(name)

    enable_extension(name)
    true
  rescue ActiveRecord::StatementInvalid => e
    say "Could not CREATE EXTENSION #{name}: #{e.message}"
    false
  end

  # CREATE INDEX CONCURRENTLY leaves an INVALID index behind when it fails -- a lock
  # timeout, or a deploy killed mid-build. if_not_exists would then skip it forever.
  def drop_invalid_index(name)
    invalid = select_value(<<~SQL)
      SELECT 1 FROM pg_class c
      JOIN pg_index i ON i.indexrelid = c.oid
      WHERE c.relname = #{quote(name)} AND NOT i.indisvalid
    SQL

    execute(%(DROP INDEX CONCURRENTLY IF EXISTS #{quote_table_name(name)})) if invalid
  end
end
