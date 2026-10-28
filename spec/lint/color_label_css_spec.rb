require "rails_helper"

# Drift guard for the colour label contract: the stylesheet must carry exactly the
# eight colours HasColor allows, each with its approved hex (one value for light and
# dark themes). The table below is the contract.
RSpec.describe "color_label.css" do
  let(:hex_by_name) do
    {
      "crimson" => "#d4203c",
      "orange" => "#e8730c",
      "lime" => "#829523",
      "teal" => "#0ca19c",
      "blue" => "#1262ed",
      "indigo" => "#9a5fe7",
      "magenta" => "#d946b8",
      "slate" => "#6b7a8d"
    }
  end

  let(:css) { File.read(File.expand_path("../../app/assets/stylesheets/color_label.css", __dir__)) }
  let(:rules) do
    css.scan(/\.color-label\[data-color="([^"]+)"\]\s*\{([^}]*)\}/m)
  end

  it "defines a rule with the exact hex for every colour and no others" do
    expect(rules.map(&:first)).to match_array(hex_by_name.keys)

    rules.each do |name, body|
      expect(body.scan(/--label-color:\s*(#[0-9a-fA-F]+)/).flatten.map(&:downcase)).to eq([hex_by_name.fetch(name)])
    end
  end

  it "draws a 3px rounded underline strip that repeats on wrapped lines" do
    base = css[/\.color-label\s*\{([^}]*)\}/m, 1]

    expect(base).to include("linear-gradient(var(--label-color), var(--label-color)) no-repeat 0 100% / 100% 3px")
    expect(base).to include("padding-bottom: 3px")
    expect(base).to include("border-radius: 3px")
    expect(base).to include("box-decoration-break: clone")
    expect(base).to include("-webkit-box-decoration-break: clone")
  end

  it "covers exactly the names HasColor allows" do
    expect(hex_by_name.keys).to match_array(HasColor::NAMES)
  end
end
