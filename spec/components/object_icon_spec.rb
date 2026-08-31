# frozen_string_literal: true

require "rails_helper"

RSpec.describe ObjectIcon, type: :component do
  fixtures :organizations, :spaces, :documents

  let(:organization) { organizations(:hc) }
  let(:space) { spaces(:hc_default) }

  def render_icon(**args)
    render_inline(described_class.new(**args))
  end

  context "when the object has an icon" do
    it "renders the emoji instead of the default glyph" do
      document = Document.create!(title: "🔥 Hot Topic", organization: organization, space: space)

      result = render_icon(object: document)

      expect(result.css("span.object-icon").text.strip).to eq("🔥")
      expect(result.css("i")).to be_empty
    end

    # Emoji are wider than the icon font, so both branches have to share one
    # fixed-width slot or list labels step sideways from row to row.
    it "uses the same slot element as the default glyph" do
      document = Document.create!(title: "🔥 Hot Topic", organization: organization, space: space)
      plain = Document.create!(title: "Hot Topic", organization: organization, space: space)

      expect(render_icon(object: document).css("span.object-icon")).to be_present
      expect(render_icon(object: plain).css("span.object-icon")).to be_present
    end

    # The client needs to know which glyph to restore when an icon is removed.
    it "carries the type's fallback glyph on the slot" do
      document = Document.create!(title: "🔥 Hot Topic", organization: organization, space: space)

      slot = render_icon(object: document).css("span.object-icon").first

      expect(slot["data-fallback-icon"]).to eq("fa-regular fa-file-lines")
    end

    it "accepts an icon passed directly, for rows that carry it on a struct" do
      result = render_icon(type: Document, icon: Icon.emoji("⭐"))

      expect(result.css("span.object-icon").text.strip).to eq("⭐")
    end
  end

  context "when the object has no icon" do
    it "falls back to the document glyph" do
      document = Document.create!(title: "Hot Topic", organization: organization, space: space)

      result = render_icon(object: document)

      expect(result.css("span.object-icon i.fa-file-lines")).to be_present
      expect(result.css("span.object-icon").text.strip).to eq("")
    end

    it "falls back to the table glyph" do
      table = Table.create!(name: "Metrics", organization: organization, space: space, parent: space)

      expect(render_icon(object: table).css("i.fa-table")).to be_present
    end

    it "falls back to the space glyph" do
      expect(render_icon(object: space).css("i.fa-space-station-moon")).to be_present
    end
  end

  context "when only a type is given" do
    it "renders the default glyph for a section header" do
      expect(render_icon(type: Document).css("i.fa-file-lines")).to be_present
    end
  end

  it "requires either an object or a type" do
    expect { render_icon }.to raise_error(/object or type/)
  end
end
