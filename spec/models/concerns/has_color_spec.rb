# frozen_string_literal: true
require "rails_helper"

RSpec.describe HasColor do
  fixtures :organizations, :spaces

  let(:organization) { organizations(:hc) }
  let(:space) { spaces(:hc_default) }
  let(:all_names) { "crimson, orange, lime, teal, blue, indigo, magenta, slate" }

  shared_examples "a record with a color" do
    def build_record(**attributes)
      described_class.new(**base_attributes, **attributes)
    end

    def raw_color(record)
      described_class.connection.select_value(
        "SELECT color FROM #{described_class.table_name} WHERE id = #{described_class.connection.quote(record.id)}"
      )
    end

    # The integer is a storage detail: appending a name must never renumber
    # the existing ones, so the order is pinned here.
    it "stores the integer for each name" do
      expect(HasColor::NAMES).to eq(%w[crimson orange lime teal blue indigo magenta slate])

      record = build_record(color: "indigo").tap(&:save!)
      expect(raw_color(record)).to eq(5)

      HasColor::NAMES.each_with_index do |name, index|
        record.update!(color: name)
        expect(raw_color(record)).to eq(index)
      end
    end

    it "serializes the name, never the integer" do
      record = build_record(color: "indigo").tap(&:save!)

      expect(record.as_json["color"]).to eq("indigo")
      expect(record.attributes["color"]).to eq("indigo")
      expect(record.reload.color).to eq("indigo")
    end

    it "serializes nil when there is no color" do
      record = build_record.tap(&:save!)

      expect(record.as_json).to include("color" => nil)
      expect(record.attributes["color"]).to be_nil
    end

    it "is invalid when color= is given an unknown name" do
      record = build_record(color: "chartreuse")

      expect(record).not_to be_valid
      expect(record.errors[:color]).to be_present
    end

    it "is valid without a color" do
      expect(build_record).to be_valid
    end

    it "includes color in the React props" do
      record = build_record(color: "teal").tap(&:save!)

      expect(record.to_react_props[:color]).to eq("teal")
    end

    describe "#assign_color" do
      let(:record) { build_record(color: "blue").tap(&:save!) }

      it "leaves the color alone for nil" do
        record.assign_color(nil)

        expect(record.color).to eq("blue")
      end

      it "clears the color for an empty string" do
        record.assign_color("")
        record.save!

        expect(record.reload.color).to be_nil
      end

      it "clears the color for a blank string" do
        record.assign_color("  ")

        expect(record.color).to be_nil
      end

      it "sets a name, ignoring case and surrounding spaces" do
        record.assign_color("  Indigo ")
        record.save!

        expect(record.reload.color).to eq("indigo")
      end

      it "raises naming the eight colors for an unknown name" do
        expect { record.assign_color("chartreuse") }
          .to raise_error(ArgumentError, "Color must be one of: #{all_names}")
        expect(record.color).to eq("blue")
      end
    end
  end

  describe "on a document" do
    let(:described_class) { Document }
    let(:base_attributes) { {title: "Roadmap", organization: organization, space: space} }

    it_behaves_like "a record with a color"
  end

  describe "on a table" do
    let(:described_class) { Table }
    let(:base_attributes) { {name: "Metrics", organization: organization, space: space} }

    it_behaves_like "a record with a color"
  end
end
