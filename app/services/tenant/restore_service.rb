# Puts archived rows back, additively: insert what is missing, never touch what is there.
#
# It runs the planner first and refuses to start if the plan is blocked. The planner exists
# to be consulted rather than admired -- a restore that walks into a conflict it was warned
# about leaves the tenant half restored, which is worse than not having started.
#
# Two rules govern the ids.
#
# String primary keys are kept. They are nanoids, globally unique, and content embeds them
# -- mentions, chart column references, formula text. A row put back under a new id would
# leave every reference to it pointing at nothing, which is why merge-back is cheap and
# cloning into a new organization is not.
#
# Integer primary keys are dropped and reassigned. They come from sequences shared across
# every tenant, so by the time an archive is restored the original value may belong to
# somebody else's row -- reusing it is a collision at best and a cross-tenant graft at
# worst. Anything referring to one is rewritten through the IdMap.
module Tenant
  class RestoreService
    class Blocked < StandardError; end

    Result = Struct.new(:inserted, :skipped, :unmatchable, :withheld, keyword_init: true)

    BATCH_SIZE = 1_000

    def initialize(organization:, reader:)
      @organization = organization
      @reader = reader
      @id_map = Tenant::IdMap.new
      @inserted = Hash.new(0)
      @skipped = Hash.new(0)
    end

    def call
      plan = Tenant::RestorePlanner.new(organization: organization, reader: reader).call

      if plan.blocked?
        raise Blocked,
          "#{plan.conflicts.size} unique-index conflict(s) would stop this restore partway " \
          "through. Run tenant:restore:plan to see them."
      end

      @unmatchable = plan.unmatchable
      @withheld = plan.withheld

      ApplicationRecord.transaction do
        Tenant::RestoreOrder::TABLES.each { |table| restore_table(table) }
        fill_deferred_references
      end

      Result.new(
        inserted: inserted,
        skipped: skipped,
        unmatchable: plan.unmatchable,
        withheld: plan.withheld,
      )
    end

    private

    attr_reader :organization, :reader, :id_map, :inserted, :skipped

    def unmatchable = @unmatchable || []

    def withheld = @withheld || {}

    def restore_table(table)
      return if table == "users" # a projection, never written back

      # A table the planner could not find a key for: there is no way to tell an archived row
      # from the one already in the database, so inserting it would duplicate the lot on
      # every run. No table is in that position now -- see .claude/rules/tenant-archive.md
      # for the eight that were, and what each was given instead -- and a spec fails if one
      # ever is again. The guard stays because the failure is silent duplication rather than
      # an error, which is the kind of thing that is only noticed by the person restoring.
      return if unmatchable.include?(table)

      # Credentials whose secret the archive drops on purpose. See
      # RestorePlanner#withholds_credentials? -- putting these back produces a token nothing
      # can authenticate with, and for three of the four the insert would fail outright.
      return if withheld.key?(table)

      rows = reader.each_row(table).to_a
      return if rows.empty?

      existing = existing_ids_by_key(table)
      matched, missing = rows.partition { |row| existing.key?(key_for(table, row)) }

      # A row already in the database keeps the id it has, which is not the archived one. The
      # IdMap has to be told, or anything pointing at that row is rewritten to the lookup's nil
      # -- which for active_storage_attachments.blob_id is a NOT NULL violation, and for a
      # nullable column is a reference silently erased. Recording the match is what makes a
      # second restore a no-op rather than a corruption.
      if bigint_keyed?(table)
        matched.each { |row| id_map.record(table, row["id"], existing[key_for(table, row)]) }
      end

      skipped[table] = matched.size
      return if missing.empty?

      missing.each_slice(BATCH_SIZE) { |batch| insert_batch(table, batch) }
      inserted[table] = missing.size
    end

    def insert_batch(table, rows)
      prepared = rows.map { |row| prepare(table, row) }
      columns = prepared.first.keys

      values = prepared.map { |row| columns.map { |c| connection.quote(row[c]) }.join(", ") }
      sql = "INSERT INTO #{connection.quote_table_name(table)} " \
            "(#{columns.map { connection.quote_column_name(_1) }.join(', ')}) " \
            "VALUES #{values.map { "(#{_1})" }.join(', ')}"

      # Integer keys were dropped above, so the sequence assigns them here and RETURNING is
      # how the new value is learned. Recorded against the archived id so anything pointing
      # at this row can be rewritten.
      if bigint_keyed?(table)
        new_ids = connection.select_values("#{sql} RETURNING id")
        rows.each_with_index { |row, i| id_map.record(table, row["id"], new_ids[i]) }
      else
        connection.execute(sql)
      end
    end

    # Strips what must not be written and rewrites what must be rewritten.
    def prepare(table, row)
      prepared = row.dup

      # Dropped rather than reused: the sequence assigns a fresh one.
      prepared.delete("id") if bigint_keyed?(table)

      # Written NULL now and filled once the row it points at exists -- see
      # RestoreOrder::DEFERRED for why the cycle cannot be resolved by ordering.
      Tenant::RestoreOrder::DEFERRED.each do |deferred_table, column|
        prepared[column] = nil if deferred_table == table && prepared.key?(column)
      end

      Tenant::IdMap::REMAPPED.each do |from_table, column, to_table|
        next unless from_table == table && prepared.key?(column) && prepared[column]

        prepared[column] = id_map.lookup(to_table, prepared[column])
      end

      prepared
    end

    # The second pass for the cycles. The rows exist by now, so the column that had to be
    # NULL on the way in can be set from the archive.
    def fill_deferred_references
      Tenant::RestoreOrder::DEFERRED.each do |table, column|
        reader.each_row(table).each do |row|
          value = row[column]
          next if value.nil?

          id = bigint_keyed?(table) ? id_map.lookup(table, row["id"]) : row["id"]
          next if id.nil?

          target = deferred_target(table, column, value)
          next if target.nil?

          connection.execute(
            "UPDATE #{connection.quote_table_name(table)} " \
            "SET #{connection.quote_column_name(column)} = #{connection.quote(target)} " \
            "WHERE id = #{connection.quote(id)}"
          )
        end
      end
    end

    def deferred_target(table, column, archived_value)
      mapping = Tenant::IdMap::REMAPPED.find { |t, c, _| t == table && c == column }
      return archived_value if mapping.nil?

      id_map.lookup(mapping[2], archived_value)
    end

    # Mirrors RestorePlanner: a string key answers directly, an integer one has to go
    # through a natural key because the archived id says nothing after reassignment.
    def key_for(table, row)
      return row["id"] if string_keyed?(table)

      columns = natural_key(table)
      return nil if columns.nil?

      columns.map { row[_1].to_s }
    end

    # key => the id the row already has. The id matters as much as the presence: see the note in
    # #restore_table about what a nil lookup does to a column pointing at a matched row.
    def existing_ids_by_key(table)
      quoted = connection.quote_table_name(table)

      if string_keyed?(table)
        connection.select_values("SELECT id FROM #{quoted}").index_by(&:itself)
      else
        columns = natural_key(table)
        return {} if columns.nil?

        list = columns.map { connection.quote_column_name(_1) }.join(", ")

        connection.select_rows("SELECT id, #{list} FROM #{quoted}").to_h do |row|
          [row[1..].map(&:to_s), row.first]
        end
      end
    end

    def natural_key(table)
      @natural_key ||= {}
      return @natural_key[table] if @natural_key.key?(table)

      sample = reader.each_row(table).first
      index = sample && connection.indexes(table)
        .select(&:unique)
        .reject { |i| Array(i.columns) == ["id"] }
        .find { |i| Array(i.columns).all? { |c| sample.key?(c) && !sample[c].nil? } }

      @natural_key[table] = index && Array(index.columns)
    end

    def string_keyed?(table)
      column = connection.columns(table).find { |c| c.name == "id" }
      column.present? && column.type == :string
    end

    def bigint_keyed?(table)
      column = connection.columns(table).find { |c| c.name == "id" }
      column.present? && %i[integer bigint].include?(column.type)
    end

    def connection = ActiveRecord::Base.connection
  end
end
