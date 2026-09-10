# Repairs what earlier imports got wrong about files converted into documents.
#
# Two independent defects, both fixed for future imports elsewhere in this change:
#
#   * a [[Plan ed.16.docx]] link became a broken mention, because the basename lookup
#     compared with the extension stripped and so never matched a target that carried one;
#   * the converted file itself was discarded, leaving no route back to the source.
#
# Read-only unless `apply: true`. Idempotent: re-running finds nothing to do.
class ImportBackfill
  attr_reader :attached, :mentions_fixed, :documents_changed, :skipped_unresolvable, :failed

  def initialize(apply: false, logger: nil)
    @apply = apply
    @logger = logger || Rails.logger
    @attached = 0
    @mentions_fixed = 0
    @documents_changed = 0
    @skipped_unresolvable = 0
    @failed = 0
    @samples = []
  end

  def run
    attach_missing_sources
    repair_convertible_mentions

    { mode: @apply ? "APPLIED" : "dry run",
      sources_attached: @attached,
      mentions_fixed: @mentions_fixed,
      documents_changed: @documents_changed,
      mentions_left_broken: @skipped_unresolvable,
      failed: @failed,
      samples: @samples }
  end

  private

  # The blob is still on the ImportFile, so this re-attaches rather than re-uploads.
  def attach_missing_sources
    ImportFile.where(file_type: ImportFile.file_types[:document])
      .where(format: ImportFile::CONVERTED_DOCUMENT_FORMATS)
      .where.not(document_id: nil)
      .find_each do |import_file|
        document = Document.find_by(id: import_file.document_id) or next
        next unless import_file.file.attached?
        next if Attachment.exists?(parent_id: document.id, parent_type: "Document",
                                   filename: import_file.filename)

        @attached += 1
        sample(:attach, import_file.filename, document.id)
        next unless @apply

        attachment = Attachment.create!(
          organization: document.organization,
          parent: document,
          filename: import_file.filename,
          mime_type: import_file.file.blob.content_type
        )
        attachment.file.attach(import_file.file.blob)
      rescue StandardError => e
        @failed += 1
        @logger.error "ImportBackfill: attaching #{import_file.id} failed: #{e.class}: #{e.message}"
      end
  end

  # Only mentions whose title now resolves are touched. Most broken mentions point at
  # notes that were never in the vault -- those are correct as they stand, and rewriting
  # them would invent links that never existed.
  def repair_convertible_mentions
    path_maps = ImportSession.all.to_h { |session| [session.space_id, session.path_map] }
    resolver = ImportLinkResolutionJob.new

    candidate_documents.find_each do |document|
      path_map = path_maps[document.space_id] or next

      repair_document(document, path_map, resolver)
    rescue StandardError => e
      @failed += 1
      @logger.error "ImportBackfill: #{document.id} failed: #{e.class}: #{e.message}"
    end
  end

  # Decoding a Y.js body costs a Node subprocess, so narrow on the stored version first.
  def candidate_documents
    ids = ActiveRecord::Base.connection.select_values(<<~SQL)
      SELECT document_id FROM (
        SELECT DISTINCT ON (document_id) document_id, content_blocks::text AS body
        FROM versions ORDER BY document_id, sequential_id DESC
      ) t WHERE t.body LIKE '%"entityId":""%' OR t.body LIKE '%"entityId": ""%'
    SQL

    Document.joins(:content).where(id: ids).where.not(object_contents: {sync: nil})
  end

  def repair_document(document, path_map, resolver)
    blocks = BlocknoteConverterService.yjs_to_blocks(document.content.sync)
    return if blocks.blank?

    fixed_here = 0

    BlocknoteBlocks.walk_blocks(blocks) do |node|
      next unless node["type"] == "mention"

      props = node["props"]
      next unless props.is_a?(Hash) && props["entityId"].to_s.empty?

      title = props["title"].to_s
      # Same precedence the importer uses, so the two cannot drift apart.
      resolved = resolver.send(:resolve_wiki_link, title, path_map)

      if resolved.blank? || resolved.to_s.start_with?("attachment:")
        @skipped_unresolvable += 1
        next
      end

      props["entityId"] = resolved
      fixed_here += 1
      sample(:mention, title, document.id)
    end

    return if fixed_here.zero?

    @mentions_fixed += fixed_here
    @documents_changed += 1
    return unless @apply

    Document.transaction do
      document.versions.create!(content_blocks: blocks, created_by: last_author(document))
      document.content.update!(sync: BlocknoteConverterService.blocks_to_yjs(blocks))
    end
  end

  def last_author(document)
    document.versions.where.not(created_by_id: nil).last&.created_by
  end

  def sample(kind, label, document_id)
    return if @samples.size >= 20

    @samples << { kind: kind, label: label.to_s.truncate(60), document: document_id }
  end
end
