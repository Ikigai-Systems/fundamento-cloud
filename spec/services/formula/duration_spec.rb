require "rails_helper"

RSpec.describe Formula::Duration do
  cases = JSON.parse(Rails.root.join("spec/fixtures/files/duration/cases.json").read)

  describe ".parse" do
    cases["valid"].each do |example|
      it "reads #{example["input"].inspect} as #{example["canonical"]}" do
        duration = described_class.parse(example["input"])

        expect(duration.seconds).to eq(example["seconds"])
        expect(duration.to_s).to eq(example["canonical"])
      end
    end

    cases["invalid"].each do |input|
      it "rejects #{input.inspect}" do
        expect(described_class.parse(input)).to be_nil
      end
    end

    it "rejects nil" do
      expect(described_class.parse(nil)).to be_nil
    end
  end

  describe "#to_s" do
    it "round-trips its canonical text" do
      cases["valid"].each do |example|
        expect(described_class.parse(example["canonical"]).seconds).to eq(example["seconds"])
      end
    end

    it "rolls hours up to days but not further" do
      expect(described_class.new(928 * 86_400).to_s).to eq("928 days")
    end
  end

  describe "comparison" do
    it "orders by length and treats equal lengths as equal" do
      expect(described_class.new(60)).to be < described_class.new(120)
      expect(described_class.new(60)).to eq(described_class.new(60))
      expect({ described_class.new(60) => 1 }[described_class.new(60)]).to eq(1)
    end
  end
end
