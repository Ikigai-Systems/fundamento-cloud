# Keeps document_blocks in step with the saved versions, as ObjectReferenceReconciler does
# for mentions: a version moves the latest-version mark of every block it has. Blocks it no
# longer has keep the mark of the last version that had them.
class DocumentBlockReconciler
  def self.reconcile(document, version)
    block_ids = BlocknoteBlocks.block_ids(version.content_blocks).uniq
    return if block_ids.empty?

    now = Time.current
    rows = block_ids.map do |block_id|
      {document_id: document.id, block_id: block_id, last_version_id: version.id, created_at: now, updated_at: now}
    end

    # Skip a version older than the mark a block already has, so a backfill can run in any order.
    DocumentBlock.upsert_all(rows, unique_by: [:document_id, :block_id],
      on_duplicate: Arel.sql("last_version_id = GREATEST(document_blocks.last_version_id, EXCLUDED.last_version_id), updated_at = EXCLUDED.updated_at"))
  end
end
