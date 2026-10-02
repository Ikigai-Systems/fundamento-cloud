# First half of the primary key swap for the six tables that could not earn a composite key.
#
# Each gets an `npi` column holding what will become its id, so the next two migrations can
# rewrite everything that points at the old integer id before the swap. Splitting it this way
# is the shape the Jan-2026 NPI wave used -- see db/migrate/20260104110000_add_npi_to_users.rb.
#
# Two differences from that wave, both deliberate:
#
#   * The column is added nullable and backfilled with an UPDATE. The wave used
#     `default: -> { "gen_random_uuid()" }, null: false`, but gen_random_uuid() is volatile, so
#     that rewrites the whole table under ACCESS EXCLUSIVE -- and `attachments` is the largest
#     table here. An UPDATE takes only ROW EXCLUSIVE and lets reads through.
#
#   * No default is set at all, rather than one being left behind. The wave left it on fifteen
#     tables, which is why those columns now hold a mix of 10-character nanoids (written by
#     ApplicationRecord#generate_id_if_needed) and 36-character UUIDs (written by raw SQL).
#     Existing rows keep the UUID the backfill gives them -- rewriting them in Ruby buys
#     nothing, since none of these ids appears in a URL -- but every new row gets a nanoid,
#     because the application is the only thing that can write the column.
#
# The two OAuth tables are the exception and keep the default: Doorkeeper::AccessToken inherits
# from ::ActiveRecord::Base, not this app's ApplicationRecord, so generate_id_if_needed never
# runs for them and nothing else would populate the column. Patching the gem's classes is the
# alternative, and Doorkeeper 5.9.3 deliberately no-ops its own run_hooks because of a
# re-entrant ApplicationRecord autoload (its comment cites issue #1828), so the database is the
# safer place to put this.
class AddNpiToUnmatchableTables < ActiveRecord::Migration[8.1]
  APP_OWNED = %i[api_tokens attachments automation_invocations object_comments pack_versions].freeze
  DOORKEEPER_OWNED = %i[oauth_access_grants oauth_access_tokens].freeze

  def up
    APP_OWNED.each do |table|
      add_column table, :npi, :string
      execute "UPDATE #{table} SET npi = gen_random_uuid()"
      change_column_null table, :npi, false
      add_index table, :npi, unique: true
    end

    DOORKEEPER_OWNED.each do |table|
      add_column table, :npi, :string, default: -> { "gen_random_uuid()" }, null: false
      add_index table, :npi, unique: true
    end
  end

  def down
    (APP_OWNED + DOORKEEPER_OWNED).each { |table| remove_column table, :npi }
  end
end
