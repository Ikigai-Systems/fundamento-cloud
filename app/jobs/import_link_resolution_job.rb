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

    @heading_maps = {}

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

    # Process documents with wiki links, Obsidian block ID markers, or local attachment paths
    has_wiki_links = blocks_json.include?("[[") || blocks_json.include?("![[")
    has_block_ids = blocks_json.match?(/\^\w{2,}/)
    attachment_paths = path_map.filter_map { |k, v| k if v.to_s.start_with?("attachment:") }
    has_local_attachment_refs = attachment_paths.any? { |p|
      blocks_json.include?(p) || blocks_json.include?(File.basename(p))
    }
    return unless has_wiki_links || has_block_ids || has_local_attachment_refs

    resolved_markdown = nil
    import_file.file.open do |f|
      # Re-fetch original markdown to process wiki links
      # (blocks don't preserve raw [[...]] syntax — we need the original)
      resolved_markdown = process_wiki_links_in_markdown(f.read.force_encoding("UTF-8"), path_map.merge(basename_map))
    end

    return unless resolved_markdown

    new_blocks = BlocknoteConverterService.markdown_to_blocks(resolved_markdown)
    fix_media_block_types!(new_blocks, path_map)
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
    # Format: space + ^alphanumeric at end of line
    markdown.gsub(/ \^[a-zA-Z0-9-]{2,}$/, "")
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

  VIDEO_BLOCK_EXTENSIONS = %w[mp4 webm ogg mov mkv flv avi wmv m4v].freeze
  AUDIO_BLOCK_EXTENSIONS = %w[mp3 wav flac aac m4a].freeze
  IMAGE_BLOCK_EXTENSIONS = %w[png jpg jpeg gif svg webp bmp ico tiff].freeze

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

  def fix_media_block_types!(blocks, path_map)
    reverse_map = path_map.each_with_object({}) do |(path, value), map|
      map[value.to_s] = path if value.to_s.start_with?("attachment:")
    end

    BlocknoteBlocks.walk_blocks(blocks) do |node|
      next unless node["type"] == "image"
      url = node.dig("props", "url").to_s
      next unless url.start_with?("attachment:")
      original_path = reverse_map[url]
      next unless original_path

      ext = File.extname(original_path).delete_prefix(".").downcase
      node["type"] = if VIDEO_BLOCK_EXTENSIONS.include?(ext)
        "video"
      elsif AUDIO_BLOCK_EXTENSIONS.include?(ext)
        "audio"
      elsif !IMAGE_BLOCK_EXTENSIONS.include?(ext)
        "file"
      else
        next
      end
    end
  end
end
