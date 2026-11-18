# The text of a date, datetime or duration cell that does not parse. It stays an ordinary string, so
# a formula that only shows or compares it keeps working, but when it meets a typed value in an
# operator the error says which column it came from instead of just "Text".
class Formula::UnreadableText < String
  KIND_NAMES = { "date" => "date", "datetime" => "datetime", "duration" => "duration" }.freeze

  attr_reader :column_name

  def initialize(text, column_name:, kind:)
    super(text)
    @column_name = column_name
    @kind = kind
  end

  def to_description
    "Text (column \"#{column_name}\" holds #{to_s.inspect}, not a valid #{KIND_NAMES.fetch(@kind, @kind)})"
  end
end
