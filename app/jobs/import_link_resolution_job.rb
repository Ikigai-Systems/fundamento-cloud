# MemoryIntensiveJob, not ApplicationJob: this walks every document in a session, reading
# each from storage and shelling out to the converter, so it has the same footprint as the
# per-document import jobs. The per-pod limit also stops two link-resolution runs for the
# same session overlapping, which is how duplicate versions were produced.
class ImportLinkResolutionJob < MemoryIntensiveJob
  include ImportFileMarkdown

  # Obsidian block-reference anchor: a space, then ^blockid, at the end of a line.
  # Shared by detection and stripping so the two can't drift apart.
  BLOCK_ID_ANCHOR = / \^[a-zA-Z0-9-]{2,}$/

  queue_as :imports

  # Called by Good Job batch on_finish callback
  # GoodJob 4.x passes (batch, { event: :finish }); import_session_id is in batch.properties with symbol keys
  def perform(batch = nil, _options = {})
    session_id = batch&.properties&.dig(:import_session_id)

    session = ImportSession.find(session_id)
    path_map = session.reload.path_map

    # Build basename index for Obsidian-style [[filename]] resolution
    basename_map = build_basename_map(path_map)

    @heading_maps = {}

    session.import_files.where(status: :completed, file_type: :document).find_each do |import_file|
      # Legacy rows can carry an unknown format; skip rather than relying on the rescue.
      next unless ImportFile::SUPPORTED_DOCUMENT_FORMATS.include?(import_file.format)

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

    # Process documents with wiki links, Obsidian block ID markers, or local attachment paths
    has_wiki_links = blocks_json.include?("[[") || blocks_json.include?("![[")
    has_block_ids = block_id_anchor?(blocks)
    attachment_paths = path_map.filter_map { |k, v| k if v.to_s.start_with?("attachment:") }
    has_local_attachment_refs = attachment_paths.any? { |p|
      blocks_json.include?(p) || blocks_json.include?(File.basename(p))
    }
    return unless has_wiki_links || has_block_ids || has_local_attachment_refs

    # Re-fetch the original markdown to process wiki links (blocks don't preserve raw
    # [[...]] syntax). Goes through the shared extractor so docx/odt are converted by
    # Pandoc instead of being read as raw bytes, and so frontmatter is stripped — without
    # that, this job reintroduces the YAML that ImportDocumentJob removed.
    body, _frontmatter = import_file_markdown(import_file)
    resolved_markdown = process_wiki_links_in_markdown(body, path_map.merge(basename_map))

    return unless resolved_markdown

    new_blocks = BlocknoteConverterService.markdown_to_blocks(resolved_markdown)

    # This job can be invoked more than once per session (any orchestrator re-run creates a
    # fresh batch, and every batch fires on_finish). Re-resolving is deterministic, so if
    # the result matches what's already stored there is nothing to record — skipping here
    # also avoids the second Node call below.
    return if blocks_equivalent?(new_blocks, blocks)

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

  # Inspects the actual text nodes rather than the serialized JSON blob. The old
  # /\^\w{2,}/ over blocks.to_json also matched "2^10", LaTeX, and anything inside a code
  # block, so most documents were re-resolved needlessly on every run.
  def block_id_anchor?(blocks)
    BlocknoteBlocks.walk_blocks(blocks) do |node|
      text = node["text"]
      return true if text.is_a?(String) && text.match?(BLOCK_ID_ANCHOR)
    end

    false
  end

  # BlockNote mints a fresh random UUID for every block, and another for every mention's
  # props["id"], on each conversion — so a plain == never matches on a re-run. Compare with
  # those generated ids removed. as_json is required, not cosmetic: content_blocks comes
  # back from the json column with string keys, and without it the guard fails open.
  def blocks_equivalent?(new_blocks, existing_blocks)
    strip_generated_ids(new_blocks.as_json) == strip_generated_ids(existing_blocks.as_json)
  end

  def strip_generated_ids(value)
    case value
    when Array then value.map { |item| strip_generated_ids(item) }
    when Hash then value.except("id").transform_values { |item| strip_generated_ids(item) }
    else value
    end
  end

  def process_wiki_links_in_markdown(markdown, combined_map)
    # Strip Obsidian block ID markers (^blockid at end of lines)
    markdown = strip_obsidian_block_ids(markdown)

    # Rewrite standard markdown ![alt](path) and ![alt](<path with spaces>) to attachment URIs.
    # Handles Obsidian exports that use angle-bracket syntax for filenames with spaces.
    # Must run before wiki-link gsubs to avoid double-processing.
    markdown = markdown.gsub(/!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)\)/) do |match|
      alt      = $1
      url_part = $2
      raw_url  = url_part.start_with?("<") ? url_part[1..-2] : url_part

      attachment_uri = resolve_attachment_link(raw_url, combined_map)
      attachment_uri ? "![#{alt}](#{attachment_uri})" : match
    end

    # Replace ![[embed]] with attachment image or document mention
    markdown = markdown.gsub(/!\[\[([^\]]+)\]\]/) do |match|
      raw = $1.strip
      target, alias_text = raw.split("|", 2)&.map(&:strip)

      attachment_uri = resolve_attachment_link(target, combined_map)
      if attachment_uri
        display = alias_text || target
        "![#{display}](#{attachment_uri})"
      else
        # Not an attachment — try document resolution (downgrade embed to mention)
        target_base, heading = target.split("#", 2)
        resolved_id = resolve_wiki_link(target_base, combined_map)
        display = alias_text || target_base

        if resolved_id&.start_with?("attachment:")
          "![#{display}](#{resolved_id})"
        elsif resolved_id
          build_mention_span(resolved_id, display, heading)
        else
          match # leave as-is
        end
      end
    end

    # Replace [[wiki links]] with mention spans or attachment links
    # Negative lookbehind prevents matching [[...]] inside ![[...]] left as-is above
    markdown.gsub(/(?<!!)\[\[([^\]]+)\]\]/) do |match|
      raw = $1.strip
      # Handle [[target|alias]] syntax
      target, alias_text = raw.split("|", 2).map(&:strip)
      # Handle [[target#heading]] syntax
      target_base, heading = target.split("#", 2)

      resolved_id = resolve_wiki_link(target_base, combined_map)
      display = alias_text || target_base

      if resolved_id&.start_with?("attachment:")
        # Resolved to an attachment — render as image/file link
        "![#{display}](#{resolved_id})"
      elsif resolved_id
        # Resolved to a document — render as mention with optional heading fragment
        build_mention_span(resolved_id, display, heading)
      elsif attachment_extension?(target_base)
        # Unresolved but looks like a file (not a document) — leave original markup as-is
        match
      else
        # Unresolved document link — broken mention
        "<span data-mention=\"document\" data-entity-id=\"\">#{display}</span>"
      end
    end
  end

  def build_mention_span(document_id, display, heading)
    fragment = resolve_heading_fragment(document_id, heading)
    fragment_attr = fragment ? " data-fragment=\"#{CGI.escapeHTML(fragment)}\"" : ""
    "<span data-mention=\"document\" data-entity-id=\"#{document_id}\"#{fragment_attr}>#{display}</span>"
  end

  def strip_obsidian_block_ids(markdown)
    # Remove ^blockid markers at end of lines (Obsidian block reference anchors)
    markdown.gsub(BLOCK_ID_ANCHOR, "")
  end

  def resolve_heading_fragment(document_id, heading)
    return nil if heading.blank?
    return nil if heading.start_with?("^") # Block refs not yet supported

    heading_map = heading_map_for(document_id)
    heading_map[heading.strip.downcase]
  end

  def heading_map_for(document_id)
    @heading_maps ||= {}
    @heading_maps[document_id] ||= build_heading_map(document_id)
  end

  def build_heading_map(document_id)
    document = Document.find_by(id: document_id)
    return {} unless document

    blocks = document.versions.last&.content_blocks
    return {} unless blocks

    map = {}
    blocks.each do |block|
      next unless block["type"] == "heading"

      text = extract_block_text(block["content"])
      next if text.blank?

      # First heading with this text wins (case-insensitive)
      map[text.strip.downcase] ||= block["id"]
    end
    map
  end

  def extract_block_text(content)
    return "" unless content.is_a?(Array)

    content.map { |c| c["text"].to_s }.join
  end

  def resolve_wiki_link(target, combined_map)
    # Try exact path match first (with .md extension)
    combined_map["#{target}.md"] ||
      combined_map[target] ||
      combined_map[target.downcase] || # case-insensitive fallback
      # Basename-only fallback for Obsidian [[filename]] style (O(n) scan)
      combined_map.find { |k, _| File.basename(k, ".*") == target }&.last
  end

  ATTACHMENT_EXTENSIONS = Set.new(%w[
    .png .jpg .jpeg .gif .svg .webp .bmp .ico .tiff
    .pdf .zip .tar .gz .rar .7z
    .mp3 .wav .flac .aac .m4a
    .mp4 .mov .avi .mkv .webm .ogg .flv .wmv .m4v
    .csv .xls .xlsx .ppt .pptx
    .ttf .otf .woff .woff2
  ]).freeze

  def attachment_extension?(target)
    ext = File.extname(target).downcase
    ext.present? && ATTACHMENT_EXTENSIONS.include?(ext)
  end

  def resolve_attachment_link(target, combined_map)
    combined_map[target] ||
      combined_map.find { |path, _|
        # Suffix match: vault path "A/B/Pliki/video.mp4" matches doc-relative target "Pliki/video.mp4"
        path.end_with?("/#{target}") ||
          # Basename match: wiki-link style target is just "video.mp4"
          File.basename(path) == target
      }&.last
  end

end
