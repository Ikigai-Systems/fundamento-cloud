require "rails_helper"

RSpec.describe Formula::Numbers do
  describe ".parse" do
    it "reads plain numbers exactly" do
      expect(described_class.parse("0.1")).to eq(Rational(1, 10))
      expect(described_class.parse(" -42 ")).to eq(-42)
      expect(described_class.parse(".5")).to eq(Rational(1, 2))
    end

    it "returns nil for anything else" do
      ["", "1e3", "0x10", "1_000", "1,5", "abc", "1.2.3", "5."].each do |text|
        expect(described_class.parse(text)).to be_nil, text
      end
    end
  end

  describe ".exact" do
    it "reads a Float as its shortest decimal" do
      expect(described_class.exact(0.1)).to eq(Rational(1, 10))
      expect(described_class.exact(2.0)).to eq(2)
    end
  end

  describe ".external" do
    it "gives Integers, and Floats rounded to 15 significant digits" do
      expect(described_class.external(Rational(3, 2))).to eq(1.5)
      expect(described_class.external(Rational(4, 2))).to eq(2)
      expect(described_class.external(Rational(1, 3))).to eq(0.333333333333333)
      expect(described_class.external(Rational(2, 3))).to eq(0.666666666666667)
    end

    it "keeps very large whole numbers exact" do
      expect(described_class.external(10**30 + 1)).to eq(10**30 + 1)
    end

    it "converts numbers inside lists and objects" do
      expect(described_class.external([Rational(1, 2), {"a" => Rational(1, 4)}])).to eq([0.5, {"a" => 0.25}])
    end
  end

  describe ".to_text" do
    it "writes a number the way people do" do
      expect(described_class.to_text(Rational(3, 2))).to eq("1.5")
      expect(described_class.to_text(Rational(-1, 8))).to eq("-0.125")
      expect(described_class.to_text(Rational(1, 3))).to eq("0.333333333333333")
      expect(described_class.to_text(1.0)).to eq("1")
      expect(described_class.to_text(1234567)).to eq("1234567")
    end
  end

  describe ".normalize" do
    it "keeps the digits of a long chain of divisions bounded" do
      value = (1..300).inject(Rational(1)) { |total, n| described_class.normalize(total / (n + 6)) }
      expect(value.numerator.to_s.size).to be < 60
    end
  end
end
