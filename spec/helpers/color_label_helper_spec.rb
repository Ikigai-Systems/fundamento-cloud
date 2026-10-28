require "rails_helper"

RSpec.describe ColorLabelHelper, type: :helper do
  it "marks an object that has a colour" do
    object = Struct.new(:color).new("indigo")

    expect(helper.color_label_attributes(object)).to eq({class: "color-label", data: {color: "indigo"}})
  end

  it "returns nothing for an object without a colour" do
    expect(helper.color_label_attributes(Struct.new(:color).new(nil))).to eq({})
  end

  it "accepts a plain colour name" do
    expect(helper.color_label_attributes("teal")).to eq({class: "color-label", data: {color: "teal"}})
  end

  it "returns nothing for nil" do
    expect(helper.color_label_attributes(nil)).to eq({})
  end

  describe "#color_labelled" do
    it "wraps the title in a labelled span when the object has a colour" do
      html = helper.color_labelled("A <b>title</b>", "teal")

      expect(html).to eq('<span class="color-label" data-color="teal">A &lt;b&gt;title&lt;/b&gt;</span>')
    end

    it "returns the title untouched when there is no colour" do
      expect(helper.color_labelled("Plain", nil)).to eq("Plain")
    end

    it "nests the label in a plain span for a flex or grid item" do
      html = helper.color_labelled("Title", "blue", wrap: true)

      expect(html).to eq('<span><span class="color-label" data-color="blue">Title</span></span>')
      expect(helper.color_labelled("Title", nil, wrap: true)).to eq("Title")
    end
  end

  it "works with a real document" do
    document = Document.new(color: "lime")

    expect(helper.color_label_attributes(document)).to eq({class: "color-label", data: {color: "lime"}})
    expect(helper.color_label_attributes(Document.new)).to eq({})
  end
end
