# Single source of truth for turning an ImportFile back into markdown.
#
# Both ImportDocumentJob and ImportLinkResolutionJob need the *body* of an import file:
# the first to create the document, the second to re-read the original wiki-link syntax
# that the converted blocks no longer preserve. They must agree on two things — how to
# handle non-markdown formats, and that YAML frontmatter is metadata, not content — or the
# second job silently regresses what the first produced.
module ImportFileMarkdown
  extend ActiveSupport::Concern
  include MarkdownFrontmatter

  class UnsupportedFormat < StandardError; end

  # Returns [body_markdown, frontmatter_hash_or_nil].
  def import_file_markdown(import_file)
    raw = import_file.file.open do |temp_file|
      case import_file.format
      when "markdown"
        temp_file.read
      when "docx", "odt"
        PandocConverterService.file_to_markdown(temp_file.path, import_file.format)
      else
        raise UnsupportedFormat, "Unsupported document format: #{import_file.format}"
      end
    end

    # ActiveStorage tempfiles and Open3 both hand back ASCII-8BIT. The link resolver
    # interpolates UTF-8 paths into this string, so tag it before anyone gsubs it. `scrub`
    # drops genuinely invalid bytes rather than letting YAML.safe_load raise on them.
    extract_frontmatter(raw.to_s.dup.force_encoding("UTF-8").scrub)
  end
end
