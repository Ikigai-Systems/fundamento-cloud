# Swaps attachments onto its string primary key, and moves the id everywhere it is embedded in
# document content.
#
# This is the one table of the eight whose ids users' own content refers to. Attachments are
# addressed as `attachment:<id>` -- in a link's href, and in a file or image block's props.url,
# which is what createFileUrlResolver resolves. Production measured:
#
#   24,432 of 29,777 versions contain `attachment:`
#    1,303 of  3,409 live Yjs documents contain it
#
# So changing the key without moving content breaks an attachment link or an embedded image in
# four documents out of five.
#
# == Why this commits as it goes
#
# The first version of this did everything in one transaction. That gave a clean all-or-nothing
# property and was the wrong trade: the content rewrite takes minutes, a single converter call
# hung, and an hour of work was discarded while the open transaction held locks and pinned the
# xmin horizon. See .claude/rules/tenant-archive.md.
#
# So it commits per row and is written to be re-run. Each pass skips what is already done, and
# the swap happens only once nothing is left -- if anything remains the migration raises, which
# means Rails does not record it and the next run continues from where this one reached.
#
# Being resumable means a partly-rewritten state is reachable and has to be harmless. It is:
# Attachment.resolve! accepts either the integer id or the npi for as long as the npi column
# exists, so a document references whichever of the two it holds and both resolve.
class MigrateAttachmentToNpiPk < ActiveRecord::Migration[8.1]
  class RewriteIncomplete < StandardError; end

  # Rails must not wrap this in one transaction -- the point is that progress survives.
  disable_ddl_transaction!

  # Shorter than the service default: in bulk, a document that takes two minutes is a document
  # to come back to, not one to wait for.
  CONVERTER_TIMEOUT = 45

  # An unrewritten reference in stored JSON: `attachment:` then digits then the end of the
  # string or a file extension. A rewritten one holds a uuid, whose first segment always meets
  # a hyphen before any quote, so this cannot match it.
  UNREWRITTEN_IN_JSON = %q{content_blocks::text ~ 'attachment:[0-9]+["."]'}

  # The same question for a Yjs blob, which has no quoting to anchor against: every
  # `attachment:` in it must be followed by something uuid-shaped, or there is work to do.
  UUID = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  MARKER = "attachment:".freeze

  def up
    mapping = select_rows("SELECT id::text, npi FROM attachments").to_h
    say "#{mapping.size} attachment id(s) to move"

    rewrite_versions(mapping)
    rewrite_yjs_documents(mapping)

    remaining = count_remaining
    raise RewriteIncomplete, incomplete_message(remaining) if remaining.values.sum.positive?

    swap_primary_key(mapping)
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
      "Cannot reverse the NPI primary key swap for attachments: document content was rewritten " \
      "with the new ids. Restore from backup."
  end

  private

  # Saved versions. Walked through BlocknoteBlocks rather than text-replaced, because
  # `attachment:12` is a prefix of `attachment:123` and a substitution would corrupt the longer.
  def rewrite_versions(mapping)
    rewritten = 0

    Version.where(UNREWRITTEN_IN_JSON).find_each(batch_size: 200) do |version|
      blocks = version.content_blocks
      next unless blocks.is_a?(Array)
      next if BlocknoteBlocks.rewrite_attachment_ids!(blocks, mapping).zero?

      version.update_column(:content_blocks, blocks) # its own statement, its own commit
      rewritten += 1
    end

    say "rewrote #{rewritten} version(s)", true
  end

  # Live editor state. Decode, rewrite, re-encode, then decode again and require the result to
  # match what we meant to write -- a Yjs blob that does not read back is worse than one with a
  # stale id in it.
  def rewrite_yjs_documents(mapping)
    rewritten = 0
    failures = []

    ObjectContent.where.not(sync: nil).find_each(batch_size: 100) do |content|
      next unless stale_reference?(content.sync)

      begin
        blocks = BlocknoteConverterService.yjs_to_blocks(content.sync, timeout: CONVERTER_TIMEOUT)
        next if BlocknoteBlocks.rewrite_attachment_ids!(blocks, mapping).zero?

        encoded = BlocknoteConverterService.blocks_to_yjs(blocks, timeout: CONVERTER_TIMEOUT)
        readback = BlocknoteConverterService.yjs_to_blocks(encoded, timeout: CONVERTER_TIMEOUT)

        if normalise(readback) != normalise(blocks)
          failures << "#{content.owner_type}##{content.owner_id}: re-encoded Yjs did not read back"
          next
        end

        content.update_column(:sync, encoded)
        rewritten += 1
      rescue BlocknoteConverterService::ConversionError => e
        # Includes ConversionTimeout. Recorded and carried past rather than raised here, so one
        # bad document does not stop the other thousand being done.
        failures << "#{content.owner_type}##{content.owner_id}: #{e.message}"
      end
    end

    say "rewrote #{rewritten} Yjs document(s)", true
    say "#{failures.size} document(s) could not be converted:", true if failures.any?
    failures.first(10).each { |failure| say failure, true }
  end

  # True when any `attachment:` in the blob is not followed by a uuid.
  def stale_reference?(sync)
    bytes = sync.to_s.b
    offset = 0

    while (index = bytes.index(MARKER, offset))
      following = bytes[index + MARKER.length, 36].to_s
      return true unless following.match?(UUID)

      offset = index + MARKER.length
    end

    false
  end

  def count_remaining
    stale_syncs = 0

    # Streamed, not `count { }` -- a block count loads every row, and these rows carry the
    # binary document state.
    ObjectContent.where.not(sync: nil).find_each(batch_size: 100) do |content|
      stale_syncs += 1 if stale_reference?(content.sync)
    end

    {
      "versions" => Version.where(UNREWRITTEN_IN_JSON).count,
      "object_contents" => stale_syncs,
    }
  end

  def incomplete_message(remaining)
    <<~MESSAGE
      #{remaining.map { |table, n| "#{table}: #{n}" }.join(', ')} still reference an attachment by
      its old integer id, so the primary key has not been swapped and this migration has not been
      recorded. Everything rewritten so far is committed; run it again to continue.

      If a document fails every time, the failures listed above name it. Both forms of reference
      resolve while the npi column exists, so nothing is broken in the meantime.
    MESSAGE
  end

  def swap_primary_key(mapping)
    transaction do
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
      change_column_default :attachments, :id, from: -> { "gen_random_uuid()" }, to: nil

      # Yjs merges rather than replaces, so a browser holding the old copy of a document would
      # fold the old ids straight back in. Rotating the id is what makes every client reload.
      DatabaseId.rotate!(connection) if mapping.any?
    end

    say "swapped the primary key and rotated database_id", true
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
