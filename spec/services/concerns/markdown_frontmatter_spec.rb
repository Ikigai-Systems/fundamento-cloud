require "rails_helper"

RSpec.describe MarkdownFrontmatter do
  let(:instance) { Class.new { include MarkdownFrontmatter }.new }

  describe "#extract_frontmatter" do
    it "extracts frontmatter and returns remaining markdown" do
      markdown = "---\ntitle: Hello\n---\n# Content"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to eq("title" => "Hello")
      expect(content).to eq("# Content")
    end

    it "returns nil frontmatter when no frontmatter is present" do
      markdown = "# Just content"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to be_nil
      expect(content).to eq("# Just content")
    end

    it "parses tags as an array" do
      markdown = "---\ntags:\n  - blog\n  - ikigai-systems/blog\n---\n# Content"
      _content, data = instance.extract_frontmatter(markdown)

      expect(data["tags"]).to eq(["blog", "ikigai-systems/blog"])
    end

    it "handles frontmatter with no body content" do
      markdown = "---\ntitle: Empty\n---\n"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to eq("title" => "Empty")
      expect(content).to eq("")
    end

    it "handles markdown that starts with --- but has no closing ---" do
      markdown = "---\ntitle: Broken\nNo closing delimiter"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to be_nil
      expect(content).to eq(markdown)
    end

    context "with Obsidian template variables" do
      it "parses key-value pairs containing {{...}} as literal strings" do
        markdown = "---\nutworzono: {{date}} {{time}}\n---\n# Content"
        _content, data = instance.extract_frontmatter(markdown)

        expect(data["utworzono"]).to eq("{{date}} {{time}}")
      end

      it "parses list items containing {{...}} as literal strings" do
        markdown = "---\ntags:\n  - rok/{{date:YYYY}}/{{date:MM}}\n  - blog\n---\n# Content"
        _content, data = instance.extract_frontmatter(markdown)

        expect(data["tags"]).to eq(["rok/{{date:YYYY}}/{{date:MM}}", "blog"])
      end

      it "handles a full Obsidian template frontmatter" do
        markdown = <<~MD
          ---
          rodzajNotatki: Przejściowa
          utworzona: {{date}} {{time}}
          tags:
            - rok/{{date:YYYY}}/{{date:MM}}
            - blog
            - ikigai-systems/blog
          ---
          # Content
        MD

        content, data = instance.extract_frontmatter(markdown)

        expect(data["rodzajNotatki"]).to eq("Przejściowa")
        expect(data["utworzona"]).to eq("{{date}} {{time}}")
        expect(data["tags"]).to eq(["rok/{{date:YYYY}}/{{date:MM}}", "blog", "ikigai-systems/blog"])
        expect(content).to eq("# Content")
      end

      it "leaves lines without template variables unchanged" do
        markdown = "---\ntitle: Normal Title\ncreated: {{date}}\n---\n# Content"
        _content, data = instance.extract_frontmatter(markdown)

        expect(data["title"]).to eq("Normal Title")
        expect(data["created"]).to eq("{{date}}")
      end
    end
  end
end
