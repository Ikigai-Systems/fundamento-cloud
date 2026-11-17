# Date, DateTime and Duration functions. They depend on the organization's time zone (what
# "today" is, where a DateTime lives), so they are built per evaluation.
#
# Weekday is ISO: Monday is 1 and Sunday is 7. DateDiff(a, b, unit) measures from a to b.
# Names are English only.
class Formula::DateTimeFunctions
  DAY_NAMES = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze
  MONTH_NAMES = %w[January February March April May June July August September October November December].freeze
  DATETIME_TEXT = /\A(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?\z/
  FORMAT_TOKENS = /\[[^\]]*\]|YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|ss|A|a/
  DURATION_UNITS = {
    "second" => 1, "minute" => Formula::Duration::MINUTE, "hour" => Formula::Duration::HOUR,
    "day" => Formula::Duration::DAY, "week" => 7 * Formula::Duration::DAY
  }.freeze
  CALENDAR_UNITS = %w[month year].freeze

  def self.build(time_zone, clock: nil)
    new(time_zone, clock).functions
  end

  def initialize(time_zone, clock)
    @zone = ActiveSupport::TimeZone[time_zone] or raise "Unknown time zone: #{time_zone}"
    @clock = clock || -> { Time.now }
  end

  def functions
    {
      "Today" => -> { now.to_date },
      "Now" => -> { now },
      "Date" => ->(year, month, day) { Date.new(year.to_i, month.to_i, day.to_i) },
      "DateTime" => ->(year, month, day, hour = 0, minute = 0, second = 0) {
        Date.new(year.to_i, month.to_i, day.to_i)
        @zone.local(year.to_i, month.to_i, day.to_i, hour.to_i, minute.to_i, second.to_i)
      },
      "ToDate" => method(:to_date),
      "ToDateTime" => method(:to_datetime),
      "Duration" => ->(days = 0, hours = 0, minutes = 0, seconds = 0) {
        Formula::Duration.new(days * DURATION_UNITS["day"] + hours * DURATION_UNITS["hour"] +
          minutes * DURATION_UNITS["minute"] + seconds)
      },
      "Weeks" => ->(n) { Formula::Duration.new(n * DURATION_UNITS["week"]) },
      "Days" => ->(n) { Formula::Duration.new(n * DURATION_UNITS["day"]) },
      "Hours" => ->(n) { Formula::Duration.new(n * DURATION_UNITS["hour"]) },
      "Minutes" => ->(n) { Formula::Duration.new(n * DURATION_UNITS["minute"]) },
      "Seconds" => ->(n) { Formula::Duration.new(n) },
      "ToDuration" => method(:to_duration),
      "Year" => ->(value) { local(value).year },
      "Month" => ->(value) { local(value).month },
      "Day" => ->(value) { local(value).day },
      "Weekday" => ->(value) { local(value).cwday },
      "Hour" => ->(value) { local_time(value).hour },
      "Minute" => ->(value) { local_time(value).min },
      "Second" => ->(value) { local_time(value).sec },
      "DayName" => ->(value) { DAY_NAMES[local(value).cwday - 1] },
      "MonthName" => ->(value) { MONTH_NAMES[local(value).month - 1] },
      "ToDays" => ->(duration) { in_unit(duration, "day") },
      "ToHours" => ->(duration) { in_unit(duration, "hour") },
      "ToMinutes" => ->(duration) { in_unit(duration, "minute") },
      "ToSeconds" => ->(duration) { in_unit(duration, "second") },
      "ToWeeks" => ->(duration) { in_unit(duration, "week") },
      "DateAdd" => method(:date_add),
      "DateDiff" => method(:date_diff),
      "StartOfWeek" => ->(value) { local(value).beginning_of_week },
      "StartOfMonth" => ->(value) { local(value).beginning_of_month },
      "StartOfYear" => ->(value) { local(value).beginning_of_year },
      "EndOfMonth" => ->(value) { local(value).end_of_month },
      "FormatDate" => method(:format_date),
      "FormatDuration" => method(:format_duration)
    }
  end

  private

  def now
    @zone.at(@clock.call)
  end

  def to_date(value)
    return value if Formula::TypedArithmetic.date?(value)
    return value.in_time_zone(@zone).to_date if Formula::TypedArithmetic.datetime?(value)

    parse_text(value).to_date
  end

  def to_datetime(value)
    return value if Formula::TypedArithmetic.datetime?(value)
    return @zone.local(value.year, value.month, value.day) if Formula::TypedArithmetic.date?(value)

    parse_text(value)
  end

  def parse_text(value)
    match = DATETIME_TEXT.match(value.to_s.strip) or raise "Cannot read #{value.inspect} as a date, use YYYY-MM-DD or YYYY-MM-DD HH:mm"
    year, month, day, hour, minute, second = match.captures.map(&:to_i)
    Date.new(year, month, day)
    @zone.local(year, month, day, hour, minute, second)
  rescue Date::Error
    raise "Cannot read #{value.inspect} as a date, it does not exist"
  end

  def to_duration(value)
    return value if value.is_a?(Formula::Duration)

    Formula::Duration.parse(value) or raise "Cannot read #{value.inspect} as a duration"
  end

  def local(value)
    Formula::TypedArithmetic.datetime?(value) ? value.in_time_zone(@zone).to_date : to_date(value)
  end

  def local_time(value)
    Formula::TypedArithmetic.date?(value) ? to_datetime(value) : value.in_time_zone(@zone)
  end

  def in_unit(duration, unit)
    raise "Expected a Duration, got #{Formula::TypedArithmetic.type_name(duration)}" unless duration.is_a?(Formula::Duration)

    duration.seconds.to_f / DURATION_UNITS.fetch(unit)
  end

  def unit_name(unit)
    unit.to_s.downcase.chomp("s")
  end

  # Days, weeks, months and years follow the calendar (a month from Jan 31 is Feb 28 or 29);
  # hours, minutes and seconds are exact and need a DateTime.
  def date_add(value, amount, unit)
    unit = unit_name(unit)
    if DURATION_UNITS.key?(unit) && DURATION_UNITS[unit] < DURATION_UNITS["day"]
      raise "A Date has no #{unit}s, use a DateTime" if Formula::TypedArithmetic.date?(value)

      return to_datetime(value) + amount * DURATION_UNITS[unit]
    end

    raise "Unknown unit: #{unit}" unless %w[day week].include?(unit) || CALENDAR_UNITS.include?(unit)
    raise "DateAdd moves by whole #{unit}s" unless amount == amount.to_i

    amount = amount.to_i
    change = { "day" => { days: amount }, "week" => { weeks: amount },
               "month" => { months: amount }, "year" => { years: amount } }.fetch(unit)
    Formula::TypedArithmetic.date?(value) ? value.advance(**change) : to_datetime(value).advance(**change)
  end

  def date_diff(from, to, unit)
    unit = unit_name(unit)
    return whole_months(local(from), local(to)) / (unit == "year" ? 12 : 1) if CALENDAR_UNITS.include?(unit)
    raise "Unknown unit: #{unit}" unless DURATION_UNITS.key?(unit)

    both_dates = Formula::TypedArithmetic.date?(from) && Formula::TypedArithmetic.date?(to)
    difference = both_dates ? (to - from).to_i * Formula::Duration::DAY : (to_datetime(to).to_time - to_datetime(from).to_time)
    difference.to_f / DURATION_UNITS.fetch(unit)
  end

  # Complete calendar months from one date to another, negative when going backwards.
  def whole_months(from, to)
    return -whole_months(to, from) if to < from

    months = (to.year - from.year) * 12 + (to.month - from.month)
    months -= 1 if to.day < from.day
    months
  end

  def format_date(value, pattern = nil)
    time = local_time(value)
    pattern ||= Formula::TypedArithmetic.date?(value) ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm"
    hour12 = time.hour % 12 == 0 ? 12 : time.hour % 12

    pattern.gsub(FORMAT_TOKENS) do |token|
      case token
      when "YYYY" then time.year.to_s
      when "YY" then format("%02d", time.year % 100)
      when "MMMM" then MONTH_NAMES[time.month - 1]
      when "MMM" then MONTH_NAMES[time.month - 1][0, 3]
      when "MM" then format("%02d", time.month)
      when "M" then time.month.to_s
      when "dddd" then DAY_NAMES[time.to_date.cwday - 1]
      when "ddd" then DAY_NAMES[time.to_date.cwday - 1][0, 3]
      when "DD" then format("%02d", time.day)
      when "D" then time.day.to_s
      when "HH" then format("%02d", time.hour)
      when "H" then time.hour.to_s
      when "hh" then format("%02d", hour12)
      when "h" then hour12.to_s
      when "mm" then format("%02d", time.min)
      when "ss" then format("%02d", time.sec)
      when "A" then time.hour < 12 ? "AM" : "PM"
      when "a" then time.hour < 12 ? "am" : "pm"
      else token[1...-1]
      end
    end
  end

  # style "ago" gives "40 days ago" for a negative duration instead of "-40 days".
  def format_duration(duration, max_unit = "days", precision = nil, style = nil)
    raise "Expected a Duration, got #{Formula::TypedArithmetic.type_name(duration)}" unless duration.is_a?(Formula::Duration)

    text = duration.format(max_unit:, precision:)
    style.to_s.downcase == "ago" && duration.negative? ? "#{text.delete_prefix("-")} ago" : text
  end
end
