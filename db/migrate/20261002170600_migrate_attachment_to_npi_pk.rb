# Swaps attachments onto its string primary key, and rewrites the id everywhere it is embedded
# in document content.
#
# This is the one table of the eight whose ids users' own content refers to. Attachments are
# addressed as `attachment:<id>` -- in a link's href, and in a file or image block's props.url,
# which is what createFileUrlResolver resolves. Production measured:
#
#   24,395 of 29,777 versions (82%) contain `attachment:`
#    1,303 of  3,409 live Yjs documents contain it
#    3,586 distinct attachment ids are referenced
#
# So changing the key without rewriting content would break an attachment link or an embedded
# image in four documents out of five. Both stores have to move together.
#
# `versions.content_blocks` is JSON and rewriting it is ordinary work. `object_contents.sync` is
# a Yjs CRDT, and the only way to edit one is to decode it, change the blocks and re-encode --
# which produces a structurally new document. Measured first: paragraphs, headings, nested lists,
# inline styles and links all survive that round trip byte-for-byte; table cells are rewritten
# into BlockNote's canonical `tableCell` form, which adds default props rather than dropping
# anything. Every rewrite is verified by decoding what was written and comparing.
#
# Two consequences worth knowing before running this:
#
#   * It is slow. Each affected Yjs document costs three subprocess calls to the converter, so
#     ~1,300 documents is minutes rather than seconds, inside one transaction so a failure leaves
#     nothing half-rewritten.
#
#   * It invalidates every browser's cached documents, by rotating `database_id`. That is not
#     politeness: the editor persists each document's Yjs state to IndexedDB, Yjs *merges*
#     rather than replaces, so a client holding the old content would fold the old ids straight
#     back in and quietly undo this. It happens here rather than in a deploy note because
#     self-hosted installs run db:prepare on boot and never run a rake task -- a manual step
#     would simply not happen for them.
class MigrateAttachmentToNpiPk < ActiveRecord::Migration[8.1]
  class ConversionFailed < StandardError; end

  def up
    mapping = select_rows("SELECT id::text, npi FROM attachments").to_h
    say "rewriting #{mapping.size} attachment id(s) where they are embedded in content"

    @rewritten = rewrite_versions(mapping) + rewrite_yjs_documents(mapping)

    # Polymorphic, already a string column, holding the integer as text.
    execute <<~SQL
      UPDATE active_storage_attachments
      SET record_id = attachments.npi
      FROM attachments
      WHERE active_storage_attachments.record_type = 'Attachment'
        AND active_storage_attachments.record_id = attachments.id::text
    SQL

    %w[auditable associated].each do |role|
      execute <<~SQL
        UPDATE audits
        SET #{role}_id = attachments.npi
        FROM attachments
        WHERE audits.#{role}_type = 'Attachment'
          AND audits.#{role}_id = attachments.id::text
      SQL
    end

    remove_index :attachments, :npi
    remove_column :attachments, :id
    rename_column :attachments, :npi, :id
    execute "ALTER TABLE attachments ADD PRIMARY KEY (id)"

    # Inside the same transaction as the rewrite: a client must never be able to merge the old
    # ids back over content this migration has changed.
    if @rewritten.positive?
      DatabaseId.rotate!(connection)
      say "rotated database_id, so every browser reloads its cached documents", true
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
      "Cannot reverse the NPI primary key swap for attachments: document content was rewritten " \
      "with the new ids. Restore from backup."
  end

  private

  # Saved versions. Walked rather than text-replaced, because `attachment:12` is a prefix of
  # `attachment:123` and a substitution would corrupt the longer one.
  def rewrite_versions(mapping)
    rewritten = 0

    Version.where("content_blocks::text LIKE '%attachment:%'").find_each(batch_size: 500) do |version|
      blocks = version.content_blocks
      next unless blocks.is_a?(Array)

      next if BlocknoteBlocks.rewrite_attachment_ids!(blocks, mapping).zero?

      version.update_column(:content_blocks, blocks)
      rewritten += 1
    end

    say "rewrote #{rewritten} version(s)", true
    rewritten
  end

  # Live editor state. Decode, rewrite, re-encode, then decode again and require the result to
  # match what we meant to write -- a Yjs blob that does not read back is worse than one with a
  # stale id in it.
  def rewrite_yjs_documents(mapping)
    rewritten = 0
    failures = []

    ObjectContent.where.not(sync: nil).find_each(batch_size: 100) do |content|
      next unless content.sync.to_s.include?("attachment:")

      begin
        blocks = BlocknoteConverterService.yjs_to_blocks(content.sync)
        next if BlocknoteBlocks.rewrite_attachment_ids!(blocks, mapping).zero?

        encoded = BlocknoteConverterService.blocks_to_yjs(blocks)
        readback = BlocknoteConverterService.yjs_to_blocks(encoded)

        if normalise(readback) != normalise(blocks)
          failures << "#{content.owner_type}##{content.owner_id}: re-encoded Yjs did not read back"
          next
        end

        content.update_column(:sync, encoded)
        rewritten += 1
      rescue BlocknoteConverterService::ConversionError => e
        failures << "#{content.owner_type}##{content.owner_id}: #{e.message}"
      end
    end

    say "rewrote #{rewritten} Yjs document(s)", true

    return rewritten if failures.empty?

    raise ConversionFailed, <<~MESSAGE
      #{failures.size} document(s) could not be rewritten, so the migration has rolled back and
      no attachment id has changed. Each of these would have been left with links pointing at
      ids that no longer exist:

      #{failures.first(20).join("\n")}
    MESSAGE
  end

  # BlockNote omits an empty `children` and fills in default table-cell props, so compare on
  # content rather than representation.
  def normalise(node)
    case node
    when Array then node.map { normalise(_1) }
    when Hash
      node.reject { |key, value| key == "children" && (value.nil? || value == []) }
          .transform_values { normalise(_1) }
          .sort.to_h
    else node
    end
  end
end
