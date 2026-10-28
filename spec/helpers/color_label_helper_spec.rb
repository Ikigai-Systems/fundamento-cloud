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

  it "works with a real document" do
    document = Document.new(color: "lime")

    expect(helper.color_label_attributes(document)).to eq({class: "color-label", data: {color: "lime"}})
    expect(helper.color_label_attributes(Document.new)).to eq({})
  end
end
