# Date, DateTime and Duration functions. They depend on the organization's time zone (what
# "today" is, where a DateTime lives), so they are built per evaluation.
#
# Weekday is ISO: Monday is 1 and Sunday is 7. DateDiff(a, b, unit) measures from a to b.
# Names are English only. Working days are Monday to Friday; the optional last argument of
# WorkDay and WorkDays take holidays that do not count: any number of dates or ISO text, or an
# array of them such as a column.
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
      "Year" => ->(value) { to_date(value).year },
      "Month" => ->(value) { to_date(value).month },
      "Day" => ->(value) { to_date(value).day },
      "Weekday" => ->(value) { to_date(value).cwday },
      "Hour" => ->(value) { local_time(value).hour },
      "Minute" => ->(value) { local_time(value).min },
      "Second" => ->(value) { local_time(value).sec },
      "DayName" => ->(value) { DAY_NAMES[to_date(value).cwday - 1] },
      "MonthName" => ->(value) { MONTH_NAMES[to_date(value).month - 1] },
      "ToDays" => ->(duration) { in_unit(duration, "day") },
      "ToHours" => ->(duration) { in_unit(duration, "hour") },
      "ToMinutes" => ->(duration) { in_unit(duration, "minute") },
      "ToSeconds" => ->(duration) { in_unit(duration, "second") },
      "ToWeeks" => ->(duration) { in_unit(duration, "week") },
      "DateAdd" => method(:date_add),
      "DateDiff" => method(:date_diff),
      "StartOfWeek" => ->(value) { to_date(value).beginning_of_week },
      "StartOfMonth" => ->(value) { to_date(value).beginning_of_month },
      "StartOfYear" => ->(value) { to_date(value).beginning_of_year },
      "EndOfMonth" => ->(value) { to_date(value).end_of_month },
      "FormatDate" => method(:format_date),
      "FormatDuration" => method(:format_duration),
      "WorkDay" => method(:work_day),
      "WorkDays" => method(:work_days),
      "WeekNumber" => ->(value) { to_date(value).cweek },
      "WeekYear" => ->(value) { to_date(value).cwyear },
      "ToTimeZone" => method(:to_time_zone)
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

  def local_time(value)
    to_datetime(value).in_time_zone(@zone)
  end

  def in_unit(duration, unit)
    raise "Expected a Duration, got #{Formula::TypedArithmetic.type_name(duration)}" unless duration.is_a?(Formula::Duration)

    duration.seconds.to_f / DURATION_UNITS.fetch(unit)
  end

  def ensure_moment(value)
    return if Formula::TypedArithmetic.moment?(value)

    raise "Expected a Date or DateTime, got #{Formula::TypedArithmetic.type_name(value)}, use ToDate or ToDateTime"
  end

  def unit_name(unit)
    unit.to_s.downcase.chomp("s")
  end

  # Days, weeks, months and years follow the calendar (a month from Jan 31 is Feb 28 or 29);
  # hours, minutes and seconds are exact and need a DateTime.
  def date_add(value, amount, unit)
    ensure_moment(value)
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
    ensure_moment(from)
    ensure_moment(to)
    unit = unit_name(unit)
    if CALENDAR_UNITS.include?(unit)
      months = whole_months(to_date(from), to_date(to))
      return unit == "year" ? months.abs / 12 * (months <=> 0) : months
    end
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
    pattern ||= Formula::TypedArithmetic.date?(value) ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm"
    render_date(local_time(value), pattern)
  end

  def render_date(time, pattern)
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

    text = duration.to_s(max_unit:, precision:)
    style.to_s.downcase == "ago" && duration.negative? ? "#{text.delete_prefix("-")} ago" : text
  end

  def holiday_set(holidays)
    holidays.flatten.map { |holiday| to_date(holiday) }.to_set
  end

  def working_day?(date, holidays)
    date.cwday < 6 && !holidays.include?(date)
  end

  # Moves n working days from the date, which itself is not counted: WorkDay(Friday, 1) is the
  # next Monday and WorkDay(date, 0) is the date even when it is a weekend.
  def work_day(value, amount, *holidays)
    raise "WorkDay moves by whole days" unless amount == amount.to_i

    date = to_date(value)
    holidays = holiday_set(holidays)
    step = amount <=> 0
    amount.to_i.abs.times do
      date += step
      date += step until working_day?(date, holidays)
    end
    date
  end

  # Working days from one date to another, both ends included, negative when going backwards.
  def work_days(from, to, *holidays)
    from = to_date(from)
    to = to_date(to)
    holidays = holiday_set(holidays)
    first, last = [from, to].minmax
    count = (first..last).count { |date| working_day?(date, holidays) }
    to < from ? -count : count
  end

  # The wall-clock a DateTime shows in another zone, as text: a DateTime result is always
  # shown in the organization's zone, so it could not carry the other zone itself.
  def to_time_zone(value, zone_name, pattern = nil)
    zone = ActiveSupport::TimeZone[zone_name.to_s] or raise "Unknown time zone: #{zone_name}"
    raise "ToTimeZone needs a DateTime, got #{Formula::TypedArithmetic.type_name(value)}, use ToDateTime" unless Formula::TypedArithmetic.datetime?(value)

    render_date(value.in_time_zone(zone), pattern || "YYYY-MM-DD HH:mm")
  end
end
