require "rails_helper"

RSpec.describe SidebarColorField, type: :component do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:document) { documents(:one) }
  let(:editable) { true }

  def html
    render_inline(described_class.new(object: document, editable: editable))
  end

  context "when editable" do
    it "renders a radiogroup of eight named swatches plus a no-color option, marking the selected one with a check mark" do
      document.update!(color: "indigo")
      result = html

      expect(result.css("[role='radiogroup'][aria-label='Color']").size).to eq(1)
      expect(result.css("[role='radio']").size).to eq(HasColor::NAMES.size + 1)

      HasColor::NAMES.each do |name|
        swatch = result.at_css("[role='radio'][aria-label='#{name.capitalize}']")
        expect(swatch["title"]).to eq(name.capitalize)
        expect(swatch["data-color"]).to eq(name)
        expect(swatch["aria-checked"]).to eq((name == "indigo").to_s)
      end

      expect(result.at_css("[role='radio'][aria-label='No color']")["aria-checked"]).to eq("false")
      expect(result.css("[aria-checked='true']").map { |swatch| swatch["aria-label"] }).to eq(["Indigo"])
      expect(result.css("[aria-checked='true'] .swatch-check").size).to eq(1)
    end

    it "shows the current color's name underlined in its color" do
      document.update!(color: "teal")
      name = html.at_css("[data-color-picker-target='name']")

      expect(name.text).to eq("Teal")
      expect(name["data-color"]).to eq("teal")
      expect(name["class"]).to include("color-label")
    end

    it "shows None and checks the no-color option when the object has no color" do
      result = html
      name = result.at_css("[data-color-picker-target='name']")

      expect(name.text).to eq("None")
      expect(name["data-color"]).to be_nil
      expect(result.css("[aria-checked='true']").map { |swatch| swatch["aria-label"] }).to eq(["No color"])
      expect(result.css("[aria-checked='true'] .swatch-check").size).to eq(1)
    end

    it "lets exactly the checked swatch take the tab stop" do
      document.update!(color: "blue")
      result = html

      expect(result.css("[role='radio'][tabindex='0']").map { |swatch| swatch["aria-label"] }).to eq(["Blue"])
    end

    it "tells the controller which object it saves" do
      container = html.at_css("[data-controller='color-picker']")

      expect(container["data-color-picker-type-value"]).to eq("document")
      expect(container["data-color-picker-id-value"]).to eq(document.id)
      expect(container["data-color-picker-color-value"]).to eq("")
    end

    it "hands the controller the current color name" do
      document.update!(color: "lime")

      expect(html.at_css("[data-controller='color-picker']")["data-color-picker-color-value"]).to eq("lime")
    end
  end

  context "when not editable" do
    let(:editable) { false }

    it "renders the color's name underlined and no controls" do
      document.update!(color: "crimson")
      result = html

      expect(result.at_css("span.color-label[data-color='crimson']").text).to eq("Crimson")
      expect(result.css("[role='radiogroup'], [role='radio'], button, [data-controller]")).to be_empty
    end

    it "shows None for an object without a color" do
      result = html

      expect(result.text).to include("None")
      expect(result.css(".color-label, [role='radiogroup']")).to be_empty
    end
  end
end
