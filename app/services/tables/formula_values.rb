# Converts table cells to the typed values the formula engine works with, and formula
# results back to the text a cell shows.
#
# Cells are always text. A number or decimal column is read as an exact number (see
# Formula::Numbers) and a checkbox as true or false. A date column stores it in the format
# chosen by the column's `dateStoredFormat` (the same index the Rowstack date cell uses); a datetime adds
# " HH:mm" as a wall-clock time that belongs to the organization's time zone, which is
# what `Now()` and `Today()` evaluate in. Text that does not parse is passed through
# as Formula::UnreadableText, so a formula reports a type error naming the column rather than
# silently treating it as empty.
module Tables::FormulaValues
  # Indexed by `dateStoredFormat`. Each pair is the strptime and the strftime format.
  DATE_FORMATS = [
    ["%m/%d/%Y", "%-m/%-d/%Y"],
    ["%d/%m/%Y", "%-d/%m/%Y"],
    ["%d.%m.%Y", "%d.%m.%Y"],
    ["%Y-%m-%d", "%Y-%m-%d"],
  ].freeze
  ISO_FORMAT = "%Y-%m-%d".freeze
  TIME_FORMAT = "%H:%M".freeze

  module_function

  # What `CurrentRow` returns for a row: typed values keyed by column name and by column id.
  def current_row(columns, values_by_column_id, time_zone)
    columns.each_with_object({}) do |column, row|
      value = typed(column, values_by_column_id[column.id], time_zone)
      row[column.name] = value
      row[column.id] = value
    end
  end

  def typed(column, value, time_zone)
    return value == "t" if column.checkbox?
    return value if value.blank?

    case column.kind
    when "number", "decimal"
      Formula::Numbers.parse(value) || unreadable(value, column)
    when "date"
      parse_date(value, column) || unreadable(value, column)
    when "datetime"
      parse_datetime(value, column, time_zone) || unreadable(value, column)
    when "duration"
      Formula::Duration.parse(value) || unreadable(value, column)
    else
      value
    end
  end

  # What a formula column shows or an action stores: dates and durations become the text a cell
  # of that type would hold, a checkbox "t" or "f". Anything else (numbers, text, lists) is left as
  # it was; a number becomes text only when written to a cell (see Formula::ActionExecutor).
  def serialized(column, result, time_zone)
    case result
    when true, false
      column.checkbox? ? (result ? "t" : "f") : result
    when Formula::Duration
      result.to_s
    when Date
      result.strftime(date_format(column).last)
    when Time, ActiveSupport::TimeWithZone
      result.in_time_zone(time_zone).strftime("#{date_format(column).last} #{TIME_FORMAT}")
    else
      result
    end
  end

  def unreadable(value, column)
    Formula::UnreadableText.new(value, column_name: column.name, kind: column.kind)
  end

  def parse_date(value, column)
    date_part = value.to_s.strip.split(" ").first
    return if date_part.blank?

    formats_for(column).each do |format|
      return Date.strptime(date_part, format)
    rescue ArgumentError
      next
    end

    nil
  end

  def parse_datetime(value, column, time_zone)
    date = parse_date(value, column)
    return if date.nil?

    time_part = value.to_s.strip.split(" ")[1]
    hour, minute = time_part.to_s.split(":").map(&:to_i)

    ActiveSupport::TimeZone[time_zone].local(date.year, date.month, date.day, hour || 0, minute || 0)
  end

  # A column that has never had its stored format picked shows M/D/YYYY in the editor but
  # parses whatever the browser accepts; here ISO text is tried first, then M/D/YYYY.
  def formats_for(column)
    index = column.configuration&.dig("dateStoredFormat")

    if index.nil?
      [ISO_FORMAT, DATE_FORMATS.first.first]
    else
      [(DATE_FORMATS[index] || DATE_FORMATS.first).first]
    end
  end

  def date_format(column)
    index = column.configuration&.dig("dateStoredFormat")

    index.nil? ? [ISO_FORMAT, ISO_FORMAT] : (DATE_FORMATS[index] || DATE_FORMATS.first)
  end
end
