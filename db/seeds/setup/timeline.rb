# db/seeds/setup/timeline.rb
# Timeline helper for relative timestamps in seed data.
# All dates anchor to Time.current so seeds always produce fresh-looking data.

class SeedTimeline
  def initialize
    @base = Time.current
  end

  # Named anchors for a ~3-month scenario history
  def company_founded  = @base - 3.months
  def first_week       = @base - 3.months + 1.week
  def onboarding_done  = @base - 2.months - 2.weeks
  def ramp_up          = @base - 2.months
  def steady_state     = @base - 1.month
  def recent           = @base - 1.week
  def today            = @base

  # Add realistic noise to a timestamp
  def around(time, spread: 2.hours)
    time + rand(-spread.to_i..spread.to_i).seconds
  end

  # Generate evenly-spread timestamps between two points
  def spread(count, from:, to:)
    return [] if count <= 0

    step = (to - from) / (count + 1)
    count.times.map { |i| from + step * (i + 1) + rand(-1.hour.to_i..1.hour.to_i).seconds }
  end
end

def self.timeline
  @timeline ||= SeedTimeline.new
end
