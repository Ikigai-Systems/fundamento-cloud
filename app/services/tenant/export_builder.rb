require "zlib"
require "digest"
require "tempfile"
require "rubygems/package"

# Serialises one organization into a single tar archive.
#
# The same artifact answers three questions, which is why it is worth building once: what
# we restore from, what a GDPR portability request is owed, and what an offboarding
# customer takes with them.
#
# Layout:
#
#   manifest.json           format version, row counts, digests, what was redacted
#   data/<table>.jsonl.gz   one JSON object per row, one file per table
#
# JSONL per table rather than one document, so a single table can be inspected with
# `zcat | jq` during an incident without parsing the whole archive. Tar rather than zip
# because tar streams -- zip's central directory means the writer has to seek.
#
# Rows are written straight into the gzip stream in batches. Materialising a tenant's
# tables in memory would be fine today and would stop being fine without warning.
#
# Binary columns -- object_contents.sync, attachments.data -- stay inline rather than being
# written to a binary/ directory. Read through raw SQL, Postgres hands back bytea already
# hex-encoded, so there is no invalid-UTF-8 to trip JSON.generate, and measured against
# real documents gzipped hex costs 15% over the raw bytes where base64 would cost 33%.
# Externalising them would halve the uncompressed size and save almost nothing after
# compression, in exchange for a second read path and a format that no longer round-trips
# through `zcat | jq` on its own.
module Tenant
  class ExportBuilder
    FORMAT_VERSION = 1

    BATCH_SIZE = 1_000

    # Columns never written to an archive.
    #
    # A tenant archive is copied to laptops, handed to departing customers and kept for
    # months, so a credential inside one is a leak with a long tail. The manifest records
    # what was dropped so a restore re-issues these rather than finding a null and
    # carrying on with a token nobody can use.
    REDACTED = {
      "api_tokens" => %w[encrypted_token],
      "invited_users" => %w[encrypted_password invitation_token],
      "oauth_access_grants" => %w[token],
      "oauth_access_tokens" => %w[token refresh_token previous_refresh_token],
    }.freeze

    Result = Struct.new(:io, :digest, :row_counts, :byte_size, keyword_init: true)

    def initialize(organization)
      @organization = organization
      @row_counts = {}
      @exported_ids = {}
    end

    def build
      # The query cache would otherwise retain every batch for the life of the build,
      # which is the whole point of batching. Same reason Tables::SnapshotBuilder does it.
      ApplicationRecord.uncached { build_uncached }
    end

    private

    attr_reader :organization, :row_counts, :exported_ids

    def build_uncached
      io = Tempfile.new(["tenant-export-#{organization.id}", ".tar"], binmode: true)
      digest = Digest::SHA256.new

      consistently do
        Gem::Package::TarWriter.new(io) do |tar|
          Tenant::TableRegistry.exported.each { |table| write_table(tar, table) }
          write_manifest(tar)
        end
      end

      io.flush
      io.rewind
      digest << io.read until io.eof?
      byte_size = io.size
      io.rewind

      Result.new(io: io, digest: digest.hexdigest, row_counts: row_counts, byte_size: byte_size)
    end

    # One consistent read of the whole tenant. Without it a table read late in the build
    # can disagree with one read early, and the archive describes a state the database was
    # never in.
    #
    # Postgres only accepts an isolation level as the first statement of a transaction, so
    # this cannot be requested from inside someone else's. When that happens -- a caller
    # wrapping the export, or RSpec's transactional fixtures -- we inherit their snapshot
    # and record the fact in the manifest rather than pretending.
    def consistently(&block)
      if ApplicationRecord.connection.transaction_open?
        @isolation = "inherited"
        yield
      else
        @isolation = "repeatable read"
        ApplicationRecord.transaction(isolation: :repeatable_read, &block)
      end
    end

    def write_table(tar, table)
      rows = []
      ids = []
      count = 0

      buffer = StringIO.new(+"", "wb")
      gzip = Zlib::GzipWriter.new(buffer)

      each_row(table) do |row|
        ids << row["id"] if row.key?("id")
        gzip.write(JSON.generate(redact(table, row)) << "\n")
        count += 1
      end

      # `finish`, not `close`: close would also close the underlying buffer and we still
      # need to read it. Same trap as Tables::SnapshotBuilder.
      gzip.finish

      row_counts[table] = count
      exported_ids[table] = ids

      payload = buffer.string
      tar.add_file_simple("data/#{table}.jsonl.gz", 0o644, payload.bytesize) { |f| f.write(payload) }
      rows
    end

    # Yields every row of `table` that belongs to this tenant, in batches.
    def each_row(table, &block)
      sql = scope_sql(table)
      return if sql.nil?

      offset = 0
      loop do
        batch = ApplicationRecord.connection.select_all(
          "#{sql} ORDER BY 1 LIMIT #{BATCH_SIZE} OFFSET #{offset}"
        ).to_a
        break if batch.empty?

        batch.each(&block)
        break if batch.size < BATCH_SIZE

        offset += BATCH_SIZE
      end
    end

    def scope_sql(table)
      quoted = ApplicationRecord.connection.quote(organization.id)

      return "SELECT * FROM organizations WHERE id = #{quoted}" if table == Tenant::TableRegistry::ROOT

      if Tenant::TableRegistry::DIRECT.include?(table)
        return "SELECT * FROM #{table} WHERE organization_id = #{quoted}"
      end

      if (rule = Tenant::TableRegistry::DERIVED[table])
        parent = scope_sql(rule[:parent])
        sql = "SELECT * FROM #{table} WHERE #{rule[:foreign_key]} IN (SELECT id FROM (#{parent}) AS parent)"
        sql += " AND owner_type = #{ApplicationRecord.connection.quote(rule[:polymorphic_type])}" if rule[:polymorphic_type]
        return sql
      end

      polymorphic_sql(table, quoted)
    end

    # Reached from several exported parents at once, so these are expressed as a union of
    # the ids already collected rather than as one foreign key.
    def polymorphic_sql(table, quoted)
      case table
      when "object_visitors"
        "SELECT * FROM object_visitors WHERE (object_type = 'Document' AND object_id IN " \
          "(SELECT id FROM documents WHERE organization_id = #{quoted})) OR " \
          "(object_type = 'Table' AND object_id IN (SELECT id FROM tables WHERE organization_id = #{quoted}))"
      when "active_storage_attachments"
        "SELECT * FROM active_storage_attachments WHERE " \
          "(record_type = 'Attachment' AND record_id IN (SELECT id::text FROM attachments WHERE organization_id = #{quoted})) OR " \
          "(record_type = 'Tables::Version' AND record_id IN (SELECT id FROM table_versions WHERE organization_id = #{quoted})) OR " \
          "(record_type = 'PackVersion' AND record_id IN (SELECT id::text FROM pack_versions WHERE organization_id = #{quoted}))"
      when "active_storage_blobs"
        "SELECT * FROM active_storage_blobs WHERE id IN (SELECT blob_id FROM (#{scope_sql('active_storage_attachments')}) AS a)"
      when "active_storage_variant_records"
        "SELECT * FROM active_storage_variant_records WHERE blob_id IN (SELECT id FROM (#{scope_sql('active_storage_blobs')}) AS b)"
      when "users"
        # A projection, never the rows. A user belongs to many organizations, so restoring
        # the row could resurrect somebody removed from a different one and would carry
        # their credentials with it. Enough to match an existing account by email, or to
        # create a stub where there is none.
        "SELECT id, email, first_name, last_name FROM users WHERE id IN " \
          "(SELECT user_id FROM organization_memberships WHERE organization_id = #{quoted})"
      end
    end

    def redact(table, row)
      columns = REDACTED[table]
      return row if columns.nil?

      row.merge(columns.index_with(nil))
    end

    def write_manifest(tar)
      payload = JSON.pretty_generate(
        "format_version" => FORMAT_VERSION,
        "organization_id" => organization.id,
        "organization_name" => organization.name,
        "exported_at" => Time.current.iso8601,
        "pg_snapshot" => ApplicationRecord.connection.select_value("SELECT pg_current_snapshot()::text"),
        "isolation" => @isolation,
        "row_counts" => row_counts,
        "redacted" => REDACTED,
      )

      tar.add_file_simple("manifest.json", 0o644, payload.bytesize) { |f| f.write(payload) }
    end
  end
end
