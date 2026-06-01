module MarkdownFrontmatter
  extend ActiveSupport::Concern

  def extract_frontmatter(markdown)
    frontmatter_data = nil

    if markdown.start_with?("---\n")
      parts = markdown.split(/^---\s*$/m, 3)
      if parts.length >= 3
        frontmatter_data = YAML.safe_load(quote_template_variables(parts[1]), permitted_classes: [Date, Time])
        markdown = parts[2].strip
      end
    end

    [markdown, frontmatter_data]
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
