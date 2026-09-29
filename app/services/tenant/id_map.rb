# Remembers what each reassigned integer id became, and names every column that has to be
# rewritten because of it.
#
# Integer primary keys come from sequences shared across all tenants, so a restore cannot
# reuse the archived value -- by now it may belong to somebody else's row. It drops the id,
# lets the sequence assign a new one, and records the pair here so anything pointing at
# that row can be corrected.
module Tenant
  class IdMap
    # [table, column, table it points at].
    #
    # Four of these the database declares as foreign keys and a spec derives them, so a new
    # one cannot be missed. The last two it does not: object_references.source_version_id
    # and source_comment_id are integer references to versions and object_comments with no
    # constraint behind them, so nothing in the schema would have revealed them. They are
    # named here because a restore that leaves them pointing at the archived id silently
    # attaches a mention to whatever row now holds that number -- possibly another
    # tenant's.
    REMAPPED = [
      ["document_editing_sessions", "version_id", "versions"],
      ["packs", "active_version_id", "pack_versions"],
      ["active_storage_attachments", "blob_id", "active_storage_blobs"],
      ["active_storage_variant_records", "blob_id", "active_storage_blobs"],
      ["object_references", "source_version_id", "versions"],
      ["object_references", "source_comment_id", "object_comments"],
    ].freeze

    # The subset the database enforces. A spec checks this against the real foreign keys,
    # so the difference between the two lists is exactly the set nobody could have derived.
    def self.constrained = REMAPPED.reject { |_, column, _| UNCONSTRAINED_COLUMNS.include?(column) }

    UNCONSTRAINED_COLUMNS = %w[source_version_id source_comment_id].freeze

    def initialize
      @map = Hash.new { |h, k| h[k] = {} }
    end

    def record(table, old_id, new_id)
      return if old_id.nil?

      @map[table][old_id.to_s] = new_id
    end

    # Returns nil when the row was not restored in this run -- it was already present under
    # a different id, or belongs to a table nothing could match. The caller decides whether
    # a dangling reference is acceptable; silently writing the archived id would not be.
    def lookup(table, old_id)
      return nil if old_id.nil?

      @map[table][old_id.to_s]
    end

    def size = @map.values.sum(&:size)
  end
end
