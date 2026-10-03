# Works out what a restore would do, without doing any of it.
#
# An operator decides whether to run a restore from this output, usually at an hour when
# nobody is at their best, so it has to be complete about what it would touch and honest
# about what it cannot do. It issues SELECTs and nothing else, and a spec enforces that by
# listening to every statement the planner makes.
#
# The conflict it exists to find: a record deleted and then recreated under the same name
# takes the unique index with it, so the archived row cannot go back without somebody
# choosing what to do. Discovering that partway through a restore leaves a tenant half
# restored; discovering it here is a decision.
module Tenant
  class RestorePlanner
    class WrongOrganization < StandardError; end

    MODES = %i[additive scoped_overwrite].freeze

    Plan = Struct.new(
      :mode, :organization_id, :rows_to_insert, :rows_already_present, :conflicts, :remapped_tables,
      :unmatchable, :withheld,
      keyword_init: true,
    ) do
      def blocked? = conflicts.any?

      def total_to_insert = rows_to_insert.values.sum
    end

    def initialize(organization:, reader:, mode: :additive)
      raise ArgumentError, "unknown mode #{mode.inspect}" unless MODES.include?(mode)

      @organization = organization
      @reader = reader
      @mode = mode
    end

    def call
      reader.format_version!
      guard_organization!

      to_insert = {}
      present = {}
      conflicts = []
      unmatchable = []
      withheld = {}

      Tenant::RestoreOrder::TABLES.each do |table|
        next if skip?(table)

        archived = reader.each_row(table).to_a
        next if archived.empty?

        if withholds_credentials?(table)
          withheld[table] = archived.size
          next
        end

        matcher = matcher_for(table, archived.first)

        if matcher.nil?
          unmatchable << table
          to_insert[table] = archived.size
          present[table] = 0
          next
        end

        missing = archived.reject { |row| matcher.call(row) }

        to_insert[table] = missing.size
        present[table] = archived.size - missing.size
        conflicts.concat(conflicts_for(table, missing))
      end

      Plan.new(
        mode: mode,
        organization_id: reader.organization_id,
        rows_to_insert: to_insert,
        rows_already_present: present,
        conflicts: conflicts,
        remapped_tables: bigint_keyed_tables,
        unmatchable: unmatchable,
        withheld: withheld,
      )
    end

    private

    attr_reader :organization, :reader, :mode

    # Restoring one tenant's archive into another would merge two tenants, silently, with
    # no way back short of the restore we are trying to avoid needing.
    def guard_organization!
      return if reader.organization_id == organization.id

      raise WrongOrganization,
        "archive belongs to organization #{reader.organization_id.inspect}, " \
        "but the restore targets #{organization.id.inspect}"
    end

    # users is a redacted projection rather than rows: it exists so a restore can match
    # people by email, never to be written back.
    def skip?(table) = table == "users"

    # Tables whose rows are credentials, and whose credential the export deliberately drops.
    #
    # These cannot be restored, and the reason is not a limitation to be fixed later: the
    # archive is handed to departing customers, so it must not carry their token ciphertext,
    # and a row put back without its secret is worse than no row at all. It looks like a
    # working API token or a pending invitation in the interface, and nothing can ever
    # authenticate with it. Three of the four would not even insert -- the redacted column is
    # NOT NULL -- which is how this was found: api_tokens used to be skipped as unmatchable, so
    # the contradiction never ran until it stopped being skipped.
    #
    # The operator is told, and the answer is to reissue, not to restore.
    def withholds_credentials?(table) = Tenant::ExportBuilder::REDACTED.key?(table)

    # How to tell whether an archived row is already in the database.
    #
    # A string primary key is a nanoid that a restore puts back unchanged, so the id
    # answers it directly. An integer primary key does not: those come from a sequence
    # shared across every tenant and are reassigned on insert, so the archived id says
    # nothing at all and the question has to go through a natural key instead.
    #
    # Returns nil when neither is available. No exported table is in that position today --
    # the eight that were have since been given a string key or a declared unique one -- but
    # this stays as a guard: a new table with an integer key and no unique index would
    # otherwise be duplicated on every restore, silently. Saying so is better than guessing,
    # and spec/services/tenant/round_trip_spec.rb fails if the set stops being empty.
    def matcher_for(table, sample_row)
      if string_keyed?(table)
        ids = Set.new(connection.select_values("SELECT id FROM #{connection.quote_table_name(table)}"))
        return ->(row) { ids.include?(row["id"]) }
      end

      index = usable_unique_index(table, sample_row)
      return nil if index.nil?

      columns = Array(index.columns)
      keys = Set.new(
        connection.select_rows(
          "SELECT #{columns.map { connection.quote_column_name(_1) }.join(', ')} " \
          "FROM #{connection.quote_table_name(table)}"
        ).map { |values| values.map(&:to_s) }
      )

      ->(row) { keys.include?(columns.map { row[_1].to_s }) }
    end

    # A unique index is only usable for matching if the archive actually carries its
    # columns with values. Redaction is what takes api_tokens and the oauth tables out:
    # their only unique key is the secret the export deliberately drops.
    def usable_unique_index(table, sample_row)
      unique_indexes(table).find do |index|
        columns = Array(index.columns)
        columns.all? { |c| sample_row.key?(c) && !sample_row[c].nil? }
      end
    end

    def string_keyed?(table)
      column = connection.columns(table).find { |c| c.name == "id" }
      column.present? && column.type == :string
    end

    # A row that cannot go back because something else now occupies its unique key.
    #
    # Derived from the database's own indexes rather than a list, so an index added later
    # is checked without anybody remembering to add it here.
    def conflicts_for(table, rows)
      return [] if rows.empty?

      unique_indexes(table).flat_map do |index|
        columns = Array(index.columns)
        next [] unless columns.all? { |c| rows.first.key?(c) }

        rows.filter_map do |row|
          values = columns.map { |c| row[c] }
          next if values.any?(&:nil?)

          holder = existing_holder(table, columns, values)
          next if holder.nil?

          {
            table: table,
            columns: columns,
            values: values,
            archived_id: row["id"],
            existing_id: holder,
          }
        end
      end
    end

    def existing_holder(table, columns, values)
      where = columns.each_with_index.map { |c, i| "#{connection.quote_column_name(c)} = #{connection.quote(values[i])}" }
      connection.select_value(
        "SELECT id::text FROM #{connection.quote_table_name(table)} WHERE #{where.join(' AND ')} LIMIT 1"
      )
    end

    def unique_indexes(table)
      @unique_indexes ||= {}
      @unique_indexes[table] ||= connection.indexes(table).select(&:unique).reject { |i| Array(i.columns) == ["id"] }
    end

    # Integer primary keys come from a sequence shared across every tenant, so by the time
    # an archive is restored the original value may belong to somebody else's row. These
    # tables have their ids reassigned on insert; the string-keyed ones keep theirs, which
    # is what lets embedded references in content survive a restore untouched.
    def bigint_keyed_tables
      Tenant::RestoreOrder::TABLES.select do |table|
        column = connection.columns(table).find { |c| c.name == "id" }
        column && %i[integer bigint].include?(column.type)
      end
    end

    def connection = ActiveRecord::Base.connection
  end
end
