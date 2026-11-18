# Operators for the typed values a formula can hold besides numbers and text:
# Date (a calendar day), DateTime (an instant in the organization's zone) and Duration.
#
# Date - Date counts calendar days; DateTime - DateTime is the real time elapsed, so across a
# daylight saving change a day can be 23 or 25 hours.
module Formula::TypedArithmetic
  def self.typed?(value)
    date?(value) || datetime?(value) || value.is_a?(Formula::Duration)
  end

  def self.date?(value)
    value.is_a?(Date) && !value.is_a?(DateTime)
  end

  def self.datetime?(value)
    value.is_a?(Time) || value.is_a?(DateTime)
  end

  def self.moment?(value)
    date?(value) || datetime?(value)
  end

  def self.type_name(value)
    case value
    when ->(v) { date?(v) } then "Date"
    when ->(v) { datetime?(v) } then "DateTime"
    when Formula::Duration then "Duration"
    when Numeric then "Number"
    when Formula::UnreadableText then value.to_description
    when String then "Text"
    else value.class.name
    end
  end

  def self.apply(operator, left, right)
    case operator
    when "+" then add(left, right)
    when "-" then subtract(left, right)
    when "*" then multiply(left, right)
    when "/" then divide(left, right)
    when "==" then left == right
    when "!=" then left != right
    else compare(operator, left, right)
    end
  end

  def self.add(left, right)
    # Addition commutes: Days(7) + Date(...) and 30 + Date(...) read as the date moved forward.
    first, second = !typed?(left) || (left.is_a?(Formula::Duration) && moment?(right)) ? [right, left] : [left, right]

    case [type_name(first), type_name(second)]
    in ["Duration", "Duration"] then first + second
    in ["Date", "Duration"] then date_plus_seconds(first, second.seconds)
    in ["Date", "Number"] then first + whole_days(second)
    in ["DateTime", "Duration"] then first + second.seconds
    else unsupported("add", left, right)
    end
  end

  def self.subtract(left, right)
    case [type_name(left), type_name(right)]
    in ["Duration", "Duration"] then left - right
    in ["Date", "Date"] then Formula::Duration.new((left - right).to_i * Formula::Duration::DAY)
    in ["DateTime", "DateTime"] then Formula::Duration.new(left.to_time - right.to_time)
    in ["Date", "Duration"] then date_plus_seconds(left, -right.seconds)
    in ["Date", "Number"] then left - whole_days(right)
    in ["DateTime", "Duration"] then left - right.seconds
    else unsupported("subtract", left, right)
    end
  end

  def self.multiply(left, right)
    left, right = right, left if left.is_a?(Numeric)

    case [type_name(left), type_name(right)]
    in ["Duration", "Number"] then left * right
    else unsupported("multiply", left, right)
    end
  end

  def self.divide(left, right)
    case [type_name(left), type_name(right)]
    in ["Duration", "Number" | "Duration"]
      raise "Division by zero" if right.is_a?(Numeric) ? right.zero? : right.seconds.zero?

      left / right
    else unsupported("divide", left, right)
    end
  end

  def self.compare(operator, left, right)
    kinds = [type_name(left), type_name(right)]
    raise "Cannot compare #{kinds.first} with #{kinds.last}" unless kinds.first == kinds.last

    left.public_send(operator, right)
  end

  def self.date_plus_seconds(date, seconds)
    unless (seconds % Formula::Duration::DAY).zero?
      raise "Cannot add hours or minutes to a Date, use a DateTime"
    end

    date + (seconds / Formula::Duration::DAY)
  end

  def self.whole_days(number)
    raise "A Date can only be moved by whole days" unless number == number.to_i

    number.to_i
  end

  def self.unsupported(verb, left, right)
    raise "Cannot #{verb} #{type_name(left)} and #{type_name(right)}"
  end

  private_class_method :date_plus_seconds, :whole_days, :unsupported
end
