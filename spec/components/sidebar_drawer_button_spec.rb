# frozen_string_literal: true

require "rails_helper"

RSpec.describe SidebarDrawerButton, type: :component do
  def render_button(side)
    render_inline(described_class.new(side: side)).css("button").first
  end

  # The chevrons match the ones the sidebars show on desktop when collapsed
  it "opens the space sidebar with a chevron pointing into the page" do
    button = render_button(:left)

    expect(button["aria-controls"]).to eq("space-sidebar")
    expect(button["aria-expanded"]).to eq("false")
    expect(button.css("span.icon-\\[tabler--chevron-right\\]")).to be_present
  end

  it "opens the content sidebar with a chevron pointing into the page" do
    button = render_button(:right)

    expect(button["aria-controls"]).to eq("content-sidebar")
    expect(button.css("span.icon-\\[tabler--chevron-left\\]")).to be_present
  end

  it "hides where the sidebars fit beside the content" do
    expect(render_button(:left)["class"]).to include("lg:hidden")
  end

  it "rejects an unknown side" do
    expect { described_class.new(side: :top) }.to raise_error(KeyError)
  end
end
