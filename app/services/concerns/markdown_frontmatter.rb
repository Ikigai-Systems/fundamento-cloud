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
