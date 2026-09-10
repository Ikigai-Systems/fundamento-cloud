# Rewrites link hrefs from the resolved path back to the internal form.
#
# wiki_links:repair ran on production before the storage rule settled, writing
# `/attachments/<id>` into 59 documents. Blocks must not name an endpoint: the same
# content is served through the authenticated route and the public one, and only the
# `attachment:<id>` form lets the viewer decide which.
#
# Read-only unless `apply: true`. Idempotent: re-running finds nothing to do.
class AttachmentHrefNormalizer
  # Only a bare, same-origin attachment path. A link someone typed to another host, or one
  # carrying a query or fragment, is left alone -- this repairs what the task wrote, and
  # nothing else.
  RESOLVED_HREF = %r{\A/attachments/(\d+)\z}

  def initialize(apply: false, space_id: nil, document_id: nil, logger: nil)
    @apply = apply
    @space_id = space_id
    @document_id = document_id
    @logger = logger || Rails.logger
    @rewritten = 0
    @documents_changed = 0
    @skipped_unknown = 0
    @failed = 0
    @samples = []
  end

  def run
    scope.find_each do |document|
      normalize_document(document)
    rescue StandardError => e
      @failed += 1
      @logger.error "AttachmentHrefNormalizer: #{document.id} failed: #{e.class}: #{e.message}"
    end

    { mode: @apply ? "APPLIED" : "dry run",
      hrefs_rewritten: @rewritten,
      documents_changed: @documents_changed,
      skipped_unknown_attachment: @skipped_unknown,
      failed: @failed,
      samples: @samples }
  end

  private

  def scope
    documents = Document.joins(:content).where.not(object_contents: {sync: nil})
    documents = documents.where(space_id: @space_id) if @space_id
    return documents.where(id: @document_id) if @document_id

    # Decoding a Y.js body costs a Node subprocess, so narrow on the stored version first.
    documents.where(id: candidate_ids)
  end

  def candidate_ids
    ActiveRecord::Base.connection.select_values(<<~SQL)
      SELECT document_id FROM (
        SELECT DISTINCT ON (document_id) document_id, content_blocks::text AS body
        FROM versions ORDER BY document_id, sequential_id DESC
      ) t WHERE t.body LIKE '%/attachments/%'
    SQL
  end

  def normalize_document(document)
    blocks = BlocknoteConverterService.yjs_to_blocks(document.content.sync)
    return if blocks.blank?

    rewritten_here = 0

    BlocknoteBlocks.walk_blocks(blocks) do |node|
      href = node["href"]
      next unless href.is_a?(String) && (match = href.match(RESOLVED_HREF))

      unless Attachment.exists?(id: match[1])
        @skipped_unknown += 1
        next
      end

      node["href"] = "attachment:#{match[1]}"
      rewritten_here += 1
      record_sample(href, document.id)
    end

    return if rewritten_here.zero?

    @rewritten += rewritten_here
    @documents_changed += 1
    return unless @apply

    Document.transaction do
      document.versions.create!(content_blocks: blocks, created_by: repair_author(document))
      document.content.update!(sync: BlocknoteConverterService.blocks_to_yjs(blocks))
    end
  end

  def repair_author(document)
    document.versions.where.not(created_by_id: nil).last&.created_by
  end

  def record_sample(href, document_id)
    return if @samples.size >= 20

    @samples << { href: href, document: document_id }
  end
end
