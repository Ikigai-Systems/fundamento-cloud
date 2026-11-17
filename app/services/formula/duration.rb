# An exact length of time, stored as whole seconds.
#
# The canonical text form is what a Duration column stores and shows: "35 mins", "1 hr 30 mins",
# "1 day 3 hrs", "365 days". It rolls up to days and no further. Months and years are accepted
# when parsing and converted to days (see UNIT_SECONDS), so they never appear in the output.
#
# The table cell will parse the same way in TypeScript. Both sides are tested against
# spec/fixtures/files/duration/cases.json, so change the rules and the fixture together.
class Formula::Duration
  include Comparable

  MINUTE = 60
  HOUR = 60 * MINUTE
  DAY = 24 * HOUR

  UNIT_SECONDS = {
    "s" => 1, "sec" => 1, "secs" => 1, "second" => 1, "seconds" => 1,
    "m" => MINUTE, "min" => MINUTE, "mins" => MINUTE, "minute" => MINUTE, "minutes" => MINUTE,
    "h" => HOUR, "hr" => HOUR, "hrs" => HOUR, "hour" => HOUR, "hours" => HOUR,
    "d" => DAY, "day" => DAY, "days" => DAY,
    "w" => 7 * DAY, "wk" => 7 * DAY, "wks" => 7 * DAY, "week" => 7 * DAY, "weeks" => 7 * DAY,
    "mo" => 30 * DAY, "mos" => 30 * DAY, "month" => 30 * DAY, "months" => 30 * DAY,
    "y" => 365 * DAY, "yr" => 365 * DAY, "yrs" => 365 * DAY, "year" => 365 * DAY, "years" => 365 * DAY
  }.freeze

  NUMBER = /\d+(?:[.,]\d+)?/
  UNIT = /[a-z]+/
  CLOCK = /\A(\d+):(\d{1,2})(?::(\d{1,2}))?\z/
  BARE_NUMBER = /\A(#{NUMBER})\z/
  TERMS = /\A(?:\s*(?:,|and\b)?\s*#{NUMBER}\s*#{UNIT})+\s*\z/
  TERM = /(#{NUMBER})\s*(#{UNIT})/

  attr_reader :seconds

  # Returns nil for text that is not a duration. A bare number means minutes.
  def self.parse(text)
    text = text.to_s.strip.downcase
    sign = text.start_with?("-") ? -1 : 1
    text = text.sub(/\A[-+]\s*/, "")
    return if text.empty?

    seconds = parse_clock(text) || parse_bare_number(text) || parse_terms(text)
    new(sign * seconds) if seconds
  end

  def self.parse_clock(text)
    match = CLOCK.match(text) or return
    hours, minutes, seconds = match.captures.map { |part| part.to_i }
    return if minutes >= 60 || seconds.to_i >= 60

    hours * HOUR + minutes * MINUTE + seconds.to_i
  end
  private_class_method :parse_clock

  def self.parse_bare_number(text)
    match = BARE_NUMBER.match(text) or return

    (to_number(match[1]) * MINUTE).round
  end
  private_class_method :parse_bare_number

  def self.parse_terms(text)
    return unless TERMS.match?(text)

    terms = text.scan(TERM)
    return unless terms.all? { |_, unit| UNIT_SECONDS.key?(unit) }

    terms.sum { |amount, unit| to_number(amount) * UNIT_SECONDS.fetch(unit) }.round
  end
  private_class_method :parse_terms

  def self.to_number(text)
    Rational(text.tr(",", "."))
  end
  private_class_method :to_number

  def initialize(seconds)
    @seconds = seconds.round
  end

  def <=>(other)
    seconds <=> other.seconds if other.is_a?(Formula::Duration)
  end

  def eql?(other)
    other.is_a?(Formula::Duration) && seconds == other.seconds
  end

  def hash
    [self.class, seconds].hash
  end

  def negative?
    seconds.negative?
  end

  def to_s
    remaining = seconds.abs
    days, remaining = remaining.divmod(DAY)
    hours, remaining = remaining.divmod(HOUR)
    minutes, secs = remaining.divmod(MINUTE)

    parts = [[days, "day", "days"], [hours, "hr", "hrs"], [minutes, "min", "mins"], [secs, "sec", "secs"]]
      .reject { |count, _, _| count.zero? }
      .map { |count, singular, plural| "#{count} #{count == 1 ? singular : plural}" }

    return "0 mins" if parts.empty?

    "#{"-" if negative?}#{parts.join(" ")}"
  end
end
