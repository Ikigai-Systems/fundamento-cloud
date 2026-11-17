require "rails_helper"

RSpec.describe Formula::DateTimeFunctions do
  let(:time_zone) { "UTC" }
  let(:clock) { -> { Time.utc(2026, 11, 17, 23, 30, 15) } }
  let(:engine) { Formula::Engine.new }

  def evaluate(formula)
    engine.evaluate(formula, time_zone:, clock:)
  end

  def stamp(value)
    value.strftime("%F %T")
  end

  describe "Today and Now" do
    it "reads the clock in UTC by default" do
      expect(evaluate("Today()")).to eq(Date.new(2026, 11, 17))
      expect(stamp(evaluate("Now()"))).to eq("2026-11-17 23:30:15")
    end

    context "in an organization zone ahead of UTC" do
      let(:time_zone) { "Pacific/Auckland" }

      it "is already tomorrow there" do
        expect(evaluate("Today()")).to eq(Date.new(2026, 11, 18))
        expect(stamp(evaluate("Now()"))).to eq("2026-11-18 12:30:15")
      end
    end

    it "uses the real clock when none is given" do
      expect(engine.evaluate("Today()")).to eq(Time.now.utc.to_date).or eq(Time.now.utc.to_date - 1)
    end
  end

  describe "constructors and conversions" do
    it "builds dates and date-times" do
      expect(evaluate("Date(2026, 2, 28)")).to eq(Date.new(2026, 2, 28))
      expect(stamp(evaluate("DateTime(2026, 2, 28, 13, 5)"))).to eq("2026-02-28 13:05:00")
    end

    it "rejects a date that does not exist" do
      expect { evaluate("Date(2026, 2, 30)") }.to raise_error(Date::Error)
      expect { evaluate("DateTime(2026, 13, 1)") }.to raise_error(Date::Error)
    end

    it "reads ISO text" do
      expect(evaluate('ToDate("2026-11-17")')).to eq(Date.new(2026, 11, 17))
      expect(stamp(evaluate('ToDateTime("2026-11-17 08:15")'))).to eq("2026-11-17 08:15:00")
      expect(stamp(evaluate('ToDateTime("2026-11-17T08:15:30")'))).to eq("2026-11-17 08:15:30")
      expect(stamp(evaluate('ToDateTime(Date(2026, 11, 17))'))).to eq("2026-11-17 00:00:00")
    end

    it "rejects text that is not a date" do
      expect { evaluate('ToDate("tomorrow")') }.to raise_error(/Cannot read "tomorrow" as a date/)
      expect { evaluate('ToDate("2026-02-30")') }.to raise_error(/does not exist/)
    end

    it "takes the date of a date-time in the organization zone" do
      expect(evaluate('ToDate(Now())')).to eq(Date.new(2026, 11, 17))
    end

    it "builds durations" do
      expect(evaluate("Duration(1, 2, 3, 4)").seconds).to eq(86_400 + 7200 + 180 + 4)
      expect(evaluate("Weeks(2)").seconds).to eq(14 * 86_400)
      expect(evaluate("Days(1.5)").seconds).to eq(129_600)
      expect(evaluate("Hours(2)").seconds).to eq(7200)
      expect(evaluate("Minutes(90)").to_s).to eq("1 hr 30 mins")
      expect(evaluate("Seconds(45)").to_s).to eq("45 secs")
      expect(evaluate('ToDuration("5h 30m")').to_s).to eq("5 hrs 30 mins")
    end

    it "rejects text that is not a duration" do
      expect { evaluate('ToDuration("soon")') }.to raise_error(/Cannot read "soon" as a duration/)
    end
  end

  describe "parts of a date" do
    it "reads year, month, day and weekday" do
      expect(evaluate("Year(Today())")).to eq(2026)
      expect(evaluate("Month(Today())")).to eq(11)
      expect(evaluate("Day(Today())")).to eq(17)
      expect(evaluate("Weekday(Today())")).to eq(2) # Tuesday, ISO numbering
      expect(evaluate("Weekday(Date(2026, 11, 22))")).to eq(7)
      expect(evaluate("DayName(Today())")).to eq("Tuesday")
      expect(evaluate("MonthName(Today())")).to eq("November")
    end

    it "reads the time of a date-time and treats a date as midnight" do
      expect([evaluate("Hour(Now())"), evaluate("Minute(Now())"), evaluate("Second(Now())")]).to eq([23, 30, 15])
      expect(evaluate("Hour(Today())")).to eq(0)
    end

    it "reads parts in the organization zone" do
      engine_zone = "Pacific/Auckland"
      expect(engine.evaluate("Day(Now())", time_zone: engine_zone, clock:)).to eq(18)
      expect(engine.evaluate("Hour(Now())", time_zone: engine_zone, clock:)).to eq(12)
    end

    it "finds the start and end of periods" do
      expect(evaluate("StartOfWeek(Today())")).to eq(Date.new(2026, 11, 16))
      expect(evaluate("StartOfMonth(Today())")).to eq(Date.new(2026, 11, 1))
      expect(evaluate("StartOfYear(Today())")).to eq(Date.new(2026, 1, 1))
      expect(evaluate("EndOfMonth(Date(2028, 2, 10))")).to eq(Date.new(2028, 2, 29))
    end
  end

  describe "durations as numbers" do
    it "converts to fractional units" do
      expect(evaluate("ToDays(Hours(36))")).to eq(1.5)
      expect(evaluate("ToHours(Minutes(90))")).to eq(1.5)
      expect(evaluate("ToMinutes(Seconds(90))")).to eq(1.5)
      expect(evaluate("ToSeconds(Minutes(2))")).to eq(120.0)
      expect(evaluate("ToWeeks(Days(21))")).to eq(3.0)
    end

    it "rejects something that is not a duration" do
      expect { evaluate("ToDays(5)") }.to raise_error(/Expected a Duration, got Number/)
    end
  end

  describe "DateAdd" do
    it "moves dates by calendar units" do
      expect(evaluate('DateAdd(Date(2026, 1, 31), 1, "months")')).to eq(Date.new(2026, 2, 28))
      expect(evaluate('DateAdd(Date(2024, 2, 29), 1, "year")')).to eq(Date.new(2025, 2, 28))
      expect(evaluate('DateAdd(Date(2026, 3, 1), 2, "weeks")')).to eq(Date.new(2026, 3, 15))
      expect(evaluate('DateAdd(Date(2026, 3, 1), 0 - 1, "days")')).to eq(Date.new(2026, 2, 28))
    end

    it "moves date-times by exact time" do
      expect(stamp(evaluate('DateAdd(DateTime(2026, 11, 17, 23, 30), 45, "minutes")'))).to eq("2026-11-18 00:15:00")
    end

    it "rejects hours on a date and unknown or fractional units" do
      expect { evaluate('DateAdd(Today(), 2, "hours")') }.to raise_error(/A Date has no hours/)
      expect { evaluate('DateAdd(Today(), 2, "fortnights")') }.to raise_error(/Unknown unit: fortnight/)
      expect { evaluate('DateAdd(Today(), 1.5, "days")') }.to raise_error(/whole days/)
    end
  end

  describe "DateDiff" do
    it "measures from the first date to the second" do
      expect(evaluate('DateDiff(Date(2026, 1, 1), Date(2026, 1, 31), "days")')).to eq(30.0)
      expect(evaluate('DateDiff(Date(2026, 1, 31), Date(2026, 1, 1), "days")')).to eq(-30.0)
      expect(evaluate('DateDiff(Date(2026, 1, 1), Date(2026, 1, 22), "weeks")')).to eq(3.0)
    end

    it "counts complete months and years" do
      expect(evaluate('DateDiff(Date(2026, 1, 31), Date(2026, 2, 28), "months")')).to eq(0)
      expect(evaluate('DateDiff(Date(2026, 1, 15), Date(2026, 4, 15), "months")')).to eq(3)
      expect(evaluate('DateDiff(Date(2026, 4, 15), Date(2026, 1, 16), "months")')).to eq(-2)
      expect(evaluate('DateDiff(Date(2020, 3, 1), Date(2026, 2, 28), "years")')).to eq(5)
    end

    it "measures date-times in hours" do
      expect(evaluate('DateDiff(DateTime(2026, 1, 1, 8), DateTime(2026, 1, 1, 20, 30), "hours")')).to eq(12.5)
    end
  end

  describe "FormatDate" do
    it "has a default for dates and date-times" do
      expect(evaluate("FormatDate(Today())")).to eq("2026-11-17")
      expect(evaluate("FormatDate(Now())")).to eq("2026-11-17 23:30")
    end

    it "replaces tokens and leaves bracketed text alone" do
      expect(evaluate('FormatDate(Now(), "dddd, D MMMM YYYY")')).to eq("Tuesday, 17 November 2026")
      expect(evaluate('FormatDate(Now(), "ddd MMM D YY")')).to eq("Tue Nov 17 26")
      expect(evaluate('FormatDate(Now(), "hh:mm:ss a")')).to eq("11:30:15 pm")
      expect(evaluate('FormatDate(Date(2026, 1, 5), "DD.MM.YYYY [at] H")')).to eq("05.01.2026 at 0")
      expect(evaluate('FormatDate(Date(2026, 1, 5), "h A")')).to eq("12 AM")
    end
  end

  describe "FormatDuration" do
    it "rolls up to days by default" do
      expect(evaluate("FormatDuration(Hours(100))")).to eq("4 days 4 hrs")
    end

    it "stops at the largest unit asked for" do
      expect(evaluate('FormatDuration(Hours(100), "hours")')).to eq("100 hrs")
      expect(evaluate('FormatDuration(Hours(1.5), "minutes")')).to eq("90 mins")
    end

    it "limits how many units are shown" do
      expect(evaluate('FormatDuration(Duration(1, 2, 3, 4), "days", 2)')).to eq("1 day 2 hrs")
    end

    it "can say ago for a negative duration" do
      expect(evaluate('FormatDuration(Days(0) - Days(40), "days", 2, "ago")')).to eq("40 days ago")
      expect(evaluate('FormatDuration(Days(0) - Days(40))')).to eq("-40 days")
      expect(evaluate('FormatDuration(Days(3), "days", 2, "ago")')).to eq("3 days")
    end

    it "rejects an unknown unit" do
      expect { evaluate('FormatDuration(Days(1), "fortnights")') }.to raise_error(/Unknown unit: fortnights/)
    end
  end
end
