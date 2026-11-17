require "rails_helper"

RSpec.describe Formula::TypedArithmetic do
  let(:time_zone) { "UTC" }
  let(:engine) { Formula::Engine.new }

  def evaluate(formula)
    engine.evaluate(formula, time_zone:, clock: -> { Time.utc(2026, 11, 17, 12) })
  end

  def stamp(value)
    value.strftime("%F %T")
  end

  describe "dates and durations" do
    it "subtracting dates counts calendar days" do
      result = evaluate("Date(2026, 3, 1) - Date(2026, 2, 1)")

      expect(result).to be_a(Formula::Duration)
      expect(result.to_s).to eq("28 days")
      expect(evaluate("Date(2026, 2, 1) - Date(2026, 3, 1)").to_s).to eq("-28 days")
    end

    it "adds and subtracts whole days from a date" do
      expect(evaluate("Date(2025, 10, 7) + Days(365)")).to eq(Date.new(2026, 10, 7))
      expect(evaluate("Days(7) + Date(2026, 1, 1)")).to eq(Date.new(2026, 1, 8))
      expect(evaluate("Date(2026, 1, 1) - Days(1)")).to eq(Date.new(2025, 12, 31))
      expect(evaluate("Date(2026, 1, 1) + 30")).to eq(Date.new(2026, 1, 31))
      expect(evaluate("30 + Date(2026, 1, 1)")).to eq(Date.new(2026, 1, 31))
      expect(evaluate("Date(2026, 1, 1) - 1")).to eq(Date.new(2025, 12, 31))
    end

    it "computes the Coda scenario: Start + Duration, then End - Today" do
      expect(evaluate('Date(2026, 11, 10) + ToDuration("10 days")')).to eq(Date.new(2026, 11, 20))
      expect(evaluate('(Date(2026, 11, 10) + ToDuration("10 days")) - Today()').to_s).to eq("3 days")
    end

    it "adds a duration with hours to a date-time but not to a date" do
      expect(stamp(evaluate("DateTime(2026, 1, 1, 23) + Hours(2)"))).to eq("2026-01-02 01:00:00")
      expect(stamp(evaluate("DateTime(2026, 1, 1, 1) - Hours(2)"))).to eq("2025-12-31 23:00:00")
      expect { evaluate("Date(2026, 1, 1) + Hours(2)") }.to raise_error(/Cannot add hours or minutes to a Date/)
    end

    it "rejects fractional days on a date" do
      expect { evaluate("Date(2026, 1, 1) + 1.5") }.to raise_error(/whole days/)
    end
  end

  describe "durations" do
    it "adds, subtracts, scales and divides" do
      expect(evaluate("Hours(1) + Minutes(30)").to_s).to eq("1 hr 30 mins")
      expect(evaluate("Hours(1) - Minutes(90)").to_s).to eq("-30 mins")
      expect(evaluate("Hours(1) * 3").to_s).to eq("3 hrs")
      expect(evaluate("3 * Hours(1)").to_s).to eq("3 hrs")
      expect(evaluate("Hours(3) / 2").to_s).to eq("1 hr 30 mins")
      expect(evaluate("Hours(3) / Minutes(30)")).to eq(6.0)
    end

    it "rejects division by zero" do
      expect { evaluate("Hours(1) / 0") }.to raise_error("Division by zero")
      expect { evaluate("Hours(1) / Seconds(0)") }.to raise_error("Division by zero")
    end

    it "compares durations, dates and date-times of the same kind" do
      expect(evaluate("Hours(2) > Minutes(90)")).to eq(true)
      expect(evaluate("Hours(2) == Minutes(120)")).to eq(true)
      expect(evaluate("Hours(2) != Minutes(120)")).to eq(false)
      expect(evaluate("Date(2026, 1, 1) < Date(2026, 1, 2)")).to eq(true)
      expect(evaluate("Date(2026, 1, 1) >= Date(2026, 1, 2)")).to eq(false)
      expect(evaluate("DateTime(2026, 1, 1, 9) <= DateTime(2026, 1, 1, 9)")).to eq(true)
    end
  end

  describe "daylight saving time" do
    let(:time_zone) { "Europe/Warsaw" }

    it "measures real elapsed time between date-times, a day can be 23 hours" do
      expect(evaluate("DateTime(2026, 3, 29, 12) - DateTime(2026, 3, 28, 12)").to_s).to eq("23 hrs")
      expect(evaluate("DateTime(2026, 10, 25, 12) - DateTime(2026, 10, 24, 12)").to_s).to eq("1 day 1 hr")
    end

    it "keeps calendar days across the change but exact hours for a duration" do
      expect(stamp(evaluate('DateAdd(DateTime(2026, 3, 28, 12), 1, "days")'))).to eq("2026-03-29 12:00:00")
      expect(stamp(evaluate("DateTime(2026, 3, 28, 12) + Days(1)"))).to eq("2026-03-29 13:00:00")
    end

    it "counts calendar days between dates" do
      expect(evaluate("Date(2026, 3, 30) - Date(2026, 3, 28)").to_s).to eq("2 days")
    end
  end

  describe "unsupported mixes" do
    it "names the types in the error" do
      expect { evaluate("Date(2026, 1, 1) + Date(2026, 1, 2)") }.to raise_error("Cannot add Date and Date")
      expect { evaluate("Date(2026, 1, 1) - DateTime(2026, 1, 1, 9)") }.to raise_error("Cannot subtract Date and DateTime")
      expect { evaluate("DateTime(2026, 1, 1, 9) + 5") }.to raise_error("Cannot add DateTime and Number")
      expect { evaluate('Hours(1) + If(True(), "soon", "later")') }.to raise_error("Cannot add Duration and Text")
      expect { evaluate('If(True(), "soon", "later") + Today()') }.to raise_error("Cannot add Text and Date")
      expect { evaluate("Date(2026, 1, 1) * 2") }.to raise_error("Cannot multiply Date and Number")
      expect { evaluate("5 / Hours(1)") }.to raise_error("Cannot divide Number and Duration")
      expect { evaluate("Hours(1) * Hours(1)") }.to raise_error("Cannot multiply Duration and Duration")
    end

    it "refuses to order values of different kinds" do
      expect { evaluate("Date(2026, 1, 1) < DateTime(2026, 1, 1, 9)") }.to raise_error("Cannot compare Date with DateTime")
      expect { evaluate("Hours(1) > 3") }.to raise_error("Cannot compare Duration with Number")
    end

    it "treats values of different kinds as not equal" do
      expect(evaluate("Hours(1) == 60")).to eq(false)
      expect(evaluate("Date(2026, 1, 1) != Hours(1)")).to eq(true)
    end
  end
end
