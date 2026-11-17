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

  describe "#format" do
    let(:duration) { described_class.new(100 * 3600 + 5 * 60 + 9) }

    it "stops rolling up at max_unit" do
      expect(duration.format).to eq("4 days 4 hrs 5 mins 9 secs")
      expect(duration.format(max_unit: "hours")).to eq("100 hrs 5 mins 9 secs")
      expect(duration.format(max_unit: "minute")).to eq("6005 mins 9 secs")
    end

    it "keeps the first non-zero units up to precision" do
      expect(duration.format(precision: 2)).to eq("4 days 4 hrs")
    end

    it "rejects an unknown unit" do
      expect { duration.format(max_unit: "weeks") }.to raise_error(ArgumentError, /Unknown unit/)
    end
  end

  describe "arithmetic" do
    it "adds, subtracts, negates and scales" do
      hour = described_class.new(3600)

      expect((hour + hour).seconds).to eq(7200)
      expect((hour - described_class.new(5400)).seconds).to eq(-1800)
      expect((-hour).seconds).to eq(-3600)
      expect((hour * 1.5).seconds).to eq(5400)
      expect((hour / 4).seconds).to eq(900)
      expect(hour / described_class.new(1800)).to eq(2.0)
    end
  end

  describe "#as_json" do
    it "is the canonical text" do
      expect(described_class.new(5400).as_json).to eq("1 hr 30 mins")
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
