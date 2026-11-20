# The numbers of the formula language are exact: a whole number is an Integer and anything else a
# Rational, so 0.1 + 0.2 is 0.3 and 1 / 3 * 3 is 1. Roots and logarithms are computed as Floats and
# read straight back as exact numbers rounded to 15 digits.
#
# Numbers enter through parse (literals, text) or exact (a Float or BigDecimal from outside) and
# leave through external, which gives a plain Integer or Float for JSON and the database.
module Formula::Numbers
  PLAIN_NUMBER = /\A-?(\d+|\d*\.\d+)\z/
  SIGNIFICANT_DIGITS = 15

  # A quotient may grow without limit (1 / 3 / 7 / 11 ...), so past this many digits in the
  # denominator it is rounded to a generous number of significant digits.
  MAX_DENOMINATOR_DIGITS = 60
  ROUNDED_DIGITS = 40

  # Strict: nil when the text is not a plain number.
  def self.parse(text)
    text = text.to_s.strip
    return unless PLAIN_NUMBER.match?(text)

    normalize(Rational(text.sub(/\A(-?)\./, '\10.')))
  end

  # Any number as an exact one. A Float is read as its shortest decimal form (0.1, not
  # 0.1000000000000000055...), which is what the person who wrote it meant.
  def self.exact(value)
    case value
    when Integer then value
    when Rational then normalize(value)
    when Float then normalize(Rational(value.to_s))
    when BigDecimal then normalize(value.to_r)
    else value
    end
  end

  def self.normalize(value)
    return value unless value.is_a?(Rational)
    return value.numerator if value.denominator == 1

    value.denominator.to_s.size > MAX_DENOMINATOR_DIGITS ? round_significant(value, ROUNDED_DIGITS) : value
  end

  # What the rest of the application sees: an Integer, or a Float rounded to 15 significant digits.
  def self.external(value)
    case value
    when Rational, Float, BigDecimal
      value = exact(value)
      value.is_a?(Integer) ? value : round_significant(value, SIGNIFICANT_DIGITS).to_f
    when Array then value.map { |item| external(item) }
    when Hash then value.transform_values { |item| external(item) }
    else value
    end
  end

  def self.round_significant(value, digits)
    return value if value.zero?

    magnitude = value.abs
    exponent = magnitude.numerator.to_s.size - magnitude.denominator.to_s.size
    exponent -= 1 while magnitude < Rational(10)**exponent
    exponent += 1 while magnitude >= Rational(10)**(exponent + 1)

    normalize_rounded(value.round(digits - 1 - exponent))
  end

  # The text of a number as people write it: 1.5, not 3/2 or 1.5e0.
  def self.to_text(value)
    value = exact(value)
    return value.to_s if value.is_a?(Integer)

    rounded = round_significant(value, SIGNIFICANT_DIGITS)
    return rounded.to_s if rounded.is_a?(Integer)

    format_decimal(rounded)
  end

  def self.format_decimal(rational)
    sign = rational.negative? ? "-" : ""
    rational = rational.abs
    whole, rest = rational.numerator.divmod(rational.denominator)
    digits = +""
    until rest.zero?
      rest *= 10
      digit, rest = rest.divmod(rational.denominator)
      digits << digit.to_s
    end
    "#{sign}#{whole}.#{digits}"
  end

  def self.normalize_rounded(value)
    value.is_a?(Rational) && value.denominator == 1 ? value.numerator : value
  end

  private_class_method :format_decimal, :normalize_rounded
end
