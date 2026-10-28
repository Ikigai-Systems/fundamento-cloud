module MarkdownFrontmatter
  extend ActiveSupport::Concern

  def extract_frontmatter(markdown)
    frontmatter_data = nil

    if markdown.start_with?("---\n")
      parts = markdown.split(/^---\s*$/m, 3)
      if parts.length >= 3
        parsed = YAML.safe_load(quote_template_variables(parts[1]), permitted_classes: [Date, Time])

        # Frontmatter is a mapping. Anything else - a list or bare text between two `---`
        # lines - is markdown (horizontal rules around content), so leave it in the body
        # rather than dropping it, or crashing callers that index into it by key.
        if parsed.nil? || parsed.is_a?(Hash)
          frontmatter_data = parsed
          markdown = parts[2].strip
        end
      end
    end

    [markdown, frontmatter_data]
  end

  # The color named by `fundamento/color`, as a lower-case name, or nil. Only the prefixed key
  # is read: a bare `color:` belongs to whatever tool wrote the file. Anything that is not a
  # known name (a number, a list, an empty string, a typo) is dropped rather than raised, so a
  # stray value never fails an import.
  def frontmatter_color(data)
    return nil unless data.is_a?(Hash)

    value = data["fundamento/color"]
    return nil unless value.is_a?(String)

    name = value.strip.downcase
    HasColor::NAMES.include?(name) ? name : nil
  end

  # The emoji in `fundamento/icon`, or nil unless it is exactly one emoji.
  def frontmatter_icon(data)
    return nil unless data.is_a?(Hash)

    value = data["fundamento/icon"]
    return nil unless value.is_a?(String)

    value = value.strip
    Icon.single_emoji?(value) ? value : nil
  end

  # The frontmatter block for a document, in the form the importers read back: `title`, then
  # `tags` (names without a leading #), `fundamento/icon` and `fundamento/color`, each only
  # when present. Built from a Hash and dumped as YAML, never by interpolation, so awkward
  # titles stay a single string value.
  #
  # `quote_template_variables` rewrites any line holding `{{` by wrapping its value in double
  # quotes, which would turn a dumped `'{{x}}'` into a string with literal quote characters.
  # A scalar containing `{{` is therefore written as a double-quoted string with its braces
  # escaped, so the line never contains `{{` and the import helper leaves it alone. Emoji get
  # the same double-quoted form, because Psych would write them as `\U0001F525` escapes.
  def build_frontmatter(document)
    data = {"title" => document.title.to_s}
    tag_names = document.tags.map(&:name).sort
    data["tags"] = tag_names if tag_names.any?
    data["fundamento/icon"] = document.icon.value if document.icon
    data["fundamento/color"] = document.color if document.color.present?

    lines = data.map do |key, value|
      if value.is_a?(String) && (value.include?("{{") || value.each_char.any? { |char| char.ord > 0xFFFF })
        "#{key}: #{JSON.generate(value).gsub("{", "\\u007B")}\n"
      else
        YAML.dump({key => value}).delete_prefix("---\n")
      end
    end

    "---\n#{lines.join}---\n\n"
  end

  private

  def quote_template_variables(yaml_text)
    return yaml_text unless yaml_text.include?("{{")

    yaml_text.lines.map do |line|
      if line.include?("{{")
        if line =~ /^(\s*-\s+)(.+)$/
          "#{$1}\"#{$2.strip}\"\n"
        elsif line =~ /^(\s*\w[^:]*:\s+)(.+)$/
          "#{$1}\"#{$2.strip}\"\n"
        else
          line
        end
      else
        line
      end
    end.join
  end
end
