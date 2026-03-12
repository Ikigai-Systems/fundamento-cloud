class ImportLinkResolutionJob < ApplicationJob
  queue_as :imports

  # Called by Good Job batch on_finish callback
  # GoodJob 4.x passes (batch, { event: :finish }); import_session_id is in batch.properties with symbol keys
  def perform(batch = nil, _options = {})
    session_id = batch&.properties&.dig(:import_session_id)

    session = ImportSession.find(session_id)
    path_map = session.reload.path_map

    # Build basename index for Obsidian-style [[filename]] resolution
    basename_map = build_basename_map(path_map)

    session.import_files.where(status: :completed, file_type: :document).find_each do |import_file|
      resolve_links_for_document(import_file, path_map, basename_map)
    end

    ImportSessionCompletionJob.perform_later(session)
  end

  private

  def build_basename_map(path_map)
    basename_map = {}
    path_map.each do |path, id|
      next unless path.end_with?(".md", ".docx", ".odt", ".doc")

      basename = File.basename(path, ".*")
      # Only add if basename is unique (first occurrence wins — shallowest path)
      basename_map[basename] ||= id
    end
    basename_map
  end

  def resolve_links_for_document(import_file, path_map, basename_map)
    document = import_file.document
    return unless document

    latest_version = document.versions.last
    return unless latest_version

    blocks = latest_version.content_blocks
    blocks_json = blocks.to_json

    return unless blocks_json.include?("[[") || blocks_json.include?("![[")

    resolved_markdown = nil
    import_file.file.open do |f|
      # Re-fetch original markdown to process wiki links
      # (blocks don't preserve raw [[...]] syntax — we need the original)
      resolved_markdown = process_wiki_links_in_markdown(f.read, path_map.merge(basename_map))
    end

    return unless resolved_markdown

    new_blocks = BlocknoteConverterService.markdown_to_blocks(resolved_markdown)
    new_sync = BlocknoteConverterService.blocks_to_yjs(new_blocks)

    document.versions.create!(
      content_blocks: new_blocks,
      created_by: import_file.import_session.organization_membership.user
    )
    document.update!(sync: new_sync)
  rescue StandardError => e
    Rails.logger.error "ImportLinkResolutionJob: failed for #{import_file.relative_path}: #{e.message}"
    # Non-fatal — continue with other documents
  end

  def process_wiki_links_in_markdown(markdown, combined_map)
    # Replace ![[attachment]] with image/file markdown using attachment: URI
    markdown = markdown.gsub(/!\[\[([^\]]+)\]\]/) do |match|
      target = $1.strip
      attachment_uri = resolve_attachment_link(target, combined_map)
      if attachment_uri
        "![#{target}](#{attachment_uri})"
      else
        match # leave as-is, will be a broken link
      end
    end

    # Replace [[wiki links]] with mention spans
    markdown.gsub(/\[\[([^\]]+)\]\]/) do |match|
      raw = $1.strip
      # Handle [[target|alias]] syntax
      target, alias_text = raw.split("|", 2).map(&:strip)
      # Handle [[target#heading]] syntax
      target_base, _heading = target.split("#", 2)

      doc_id = resolve_wiki_link(target_base, combined_map)
      display = alias_text || target_base

      if doc_id
        "<span data-mention=\"document\" data-entity-id=\"#{doc_id}\">#{display}</span>"
      else
        "<span data-mention=\"document\" data-entity-id=\"\">#{display}</span>"
      end
    end
  end

  def resolve_wiki_link(target, combined_map)
    # Try exact path match first (with .md extension)
    combined_map["#{target}.md"] ||
      combined_map[target] ||
      combined_map[target.downcase] || # case-insensitive fallback
      # Basename-only fallback for Obsidian [[filename]] style (O(n) scan)
      combined_map.find { |k, _| File.basename(k, ".*") == target }&.last
  end

  def resolve_attachment_link(target, combined_map)
    combined_map[target] ||
      combined_map.find { |path, _| File.basename(path) == target }&.last
  end
end
