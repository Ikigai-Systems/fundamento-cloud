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

    it "leaves a list between two --- lines in the body" do
      markdown = "---\n- one\n- two\n---\n# Content"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to be_nil
      expect(content).to eq(markdown)
    end

    it "leaves bare text between two --- lines in the body" do
      markdown = "---\nJust a paragraph\n---\n# Content"
      content, data = instance.extract_frontmatter(markdown)

      expect(data).to be_nil
      expect(content).to eq(markdown)
    end

    it "strips empty frontmatter" do
      content, data = instance.extract_frontmatter("---\n---\n# Content")

      expect(data).to be_nil
      expect(content).to eq("# Content")
    end

    it "parses date values without raising" do
      markdown = <<~MD
        ---
        title: Zettelkasten
        clipped: 2024-05-05
        tags:
          - clippings
        ---
        # Content
      MD

      content, data = instance.extract_frontmatter(markdown)

      expect(data["title"]).to eq("Zettelkasten")
      expect(data["clipped"]).to eq(Date.new(2024, 5, 5))
      expect(data["tags"]).to eq(["clippings"])
      expect(content).to eq("# Content")
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

  describe "#frontmatter_color" do
    it "returns a valid name, matched case-insensitively after trimming" do
      expect(instance.frontmatter_color("fundamento/color" => "indigo")).to eq("indigo")
      expect(instance.frontmatter_color("fundamento/color" => "Indigo")).to eq("indigo")
      expect(instance.frontmatter_color("fundamento/color" => " indigo ")).to eq("indigo")
    end

    it "ignores a bare color key" do
      expect(instance.frontmatter_color("color" => "blue")).to be_nil
    end

    [["an unknown name", "chartreuse"], ["a number", 3], ["a boolean", true], ["a list", ["blue"]],
      ["an empty string", ""], ["whitespace", "  "], ["nil", nil]].each do |label, value|
      it "returns nil for #{label}" do
        expect(instance.frontmatter_color("fundamento/color" => value)).to be_nil
      end
    end

    it "returns nil for missing or non-hash data" do
      expect(instance.frontmatter_color(nil)).to be_nil
      expect(instance.frontmatter_color("blue")).to be_nil
      expect(instance.frontmatter_color(["blue"])).to be_nil
    end
  end

  describe "#frontmatter_icon" do
    it "returns a single emoji" do
      expect(instance.frontmatter_icon("fundamento/icon" => "🔥")).to eq("🔥")
      expect(instance.frontmatter_icon("fundamento/icon" => " 🔥 ")).to eq("🔥")
    end

    {"a flag" => "🇵🇱", "a ZWJ sequence" => "👩‍💻", "a skin-tone emoji" => "👍🏽", "a variation-selector emoji" => "❤️"}.each do |label, emoji|
      it "returns #{label} unchanged" do
        expect(instance.frontmatter_icon("fundamento/icon" => emoji)).to eq(emoji)
      end
    end

    it "ignores a bare icon key" do
      expect(instance.frontmatter_icon("icon" => "🔥")).to be_nil
    end

    [["a word", "fire"], ["two emoji", "🔥🔥"], ["a number", 7], ["a list", ["🔥"]], ["an empty string", ""]].each do |label, value|
      it "returns nil for #{label}" do
        expect(instance.frontmatter_icon("fundamento/icon" => value)).to be_nil
      end
    end

    it "returns nil for missing or non-hash data" do
      expect(instance.frontmatter_icon(nil)).to be_nil
      expect(instance.frontmatter_icon("🔥")).to be_nil
    end
  end

  describe "#build_frontmatter" do
    fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_contents

    let(:document) { documents(:one) }

    def tag!(document, *names)
      TagsService.new(object: document, organization: document.organization).update_tags(names)
    end

    it "emits title, tags, icon and color in that order, framed by --- lines and a blank line" do
      document.assign_title_and_icon(title: "Plan", icon: "🔥")
      document.assign_color("indigo")
      document.save!
      tag!(document, "#blog", "ikigai/blog")

      block = instance.build_frontmatter(document.reload)

      expect(block).to start_with("---\ntitle: Plan\n")
      expect(block).to end_with("---\n\n")
      keys = block.lines.grep(/\A[a-z\/]+:/).map { |line| line[/\A[a-z\/]+/] }
      expect(keys).to eq(["title", "tags", "fundamento/icon", "fundamento/color"])
    end

    it "omits tags, icon and color when the document has none" do
      document.update!(title: "Plain", color: nil, icon_type: nil, icon_value: nil)

      expect(instance.build_frontmatter(document.reload)).to eq("---\ntitle: Plain\n---\n\n")
    end

    it "writes tag names without a leading #, which import accepts" do
      tag!(document, "#Blog")

      _body, data = instance.extract_frontmatter(instance.build_frontmatter(document.reload) + "body")

      expect(data["tags"]).to eq(["blog"])
    end

    [
      ["a colon", "Plan: Q4"],
      ["a leading #", "#1 priority"],
      ["quotes", "Plan: Q4 \"launch\" #1 and 'more'"],
      ["template braces", "Hello {{x}} there"],
      ["only template braces", "{{x}}"],
      ["a quoted template", "Say \"{{x}}\" now"],
      ["a number", "123"],
      ["true", "true"],
      ["null", "null"],
      ["a date", "2024-01-01"],
      ["a line break", "Line one\nLine two"],
      ["a --- line", "Above\n---\nBelow"],
      ["an emoji", "Launch 🚀 day"],
      ["a trailing space", "Trailing "],
      ["a leading space", " Leading"],
      ["a very long title", "Long " * 200],
      ["a backslash", "C:\\path\\file"],
      ["a dash", "- not a list"],
    ].each do |label, title|
      it "round trips a title with #{label}" do
        document.assign_title_and_icon(title: title, icon: "🔥")
        document.assign_color("teal")
        document.save!
        tag!(document, "alpha", "beta/gamma")
        document.reload

        body, data = instance.extract_frontmatter(instance.build_frontmatter(document) + "body")

        expect(body).to eq("body")
        expect(data["title"]).to eq(document.title)
        expect(data["tags"]).to match_array(["alpha", "beta/gamma"])
        expect(instance.frontmatter_icon(data)).to eq("🔥")
        expect(instance.frontmatter_color(data)).to eq("teal")
      end
    end
  end
end
