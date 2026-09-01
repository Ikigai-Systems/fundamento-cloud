# frozen_string_literal: true

# An object's icon, as a small value object over the persisted `icon_type` and
# `icon_value` columns.
#
# Icons used to be derived from the title on every read, which meant the same
# fuzzy "is this leading character an emoji?" question had to be re-answered in
# every layer that rendered a title. They are now normalized once on write and
# simply read back here.
#
# Only `emoji` exists today. The type discriminator is deliberate: a built-in
# glyph set (with a color) or an uploaded image can be added later without
# touching a single render site.
class Icon
  EMOJI = "emoji"

  # Anchored to the start of the string, and consuming whatever whitespace
  # separates the emoji from the rest of the title.
  #
  # Unicode::Emoji::REGEX is the RGI set generated from the Unicode data files --
  # the same set browsers match with /\p{RGI_Emoji}/v, so Ruby and JavaScript can
  # never disagree about what counts as an emoji. Hand-rolled codepoint ranges
  # cannot get this right: they miss keycaps (1️⃣), flags (🇺🇸) and anything added
  # after they were written, while wrongly matching dingbats like ✓ and ✂.
  LEADING_EMOJI = /\A(#{Unicode::Emoji::REGEX})[[:space:]]*/

  attr_reader :type, :value

  class << self
    # Splits a leading emoji off a string.
    #
    #   Icon.split_leading("🔥 Hot Topic")  # => ["🔥", "Hot Topic"]
    #   Icon.split_leading("🔥Hot Topic")   # => ["🔥", "Hot Topic"]
    #   Icon.split_leading("🔥")            # => ["🔥", ""]
    #   Icon.split_leading("✓ Reviewed")    # => nil
    #   Icon.split_leading("Hot Topic")     # => nil
    #
    # Returns nil when the string does not start with an emoji.
    def split_leading(string)
      return nil if string.blank?

      match = LEADING_EMOJI.match(string)
      return nil unless match

      [match[1], string[match.end(0)..]]
    end

    def emoji(value)
      new(type: EMOJI, value: value)
    end

    # Builds an Icon from the persisted columns, or nil when the record has none.
    def from_columns(type, value)
      return nil if type.blank? || value.blank?

      new(type: type, value: value)
    end
  end

  def initialize(type:, value:)
    @type = type.to_s
    @value = value
  end

  def emoji?
    type == EMOJI
  end

  def as_json(*)
    {type: type, value: value}
  end

  def to_s
    value.to_s
  end

  def ==(other)
    other.is_a?(Icon) && other.type == type && other.value == value
  end
  alias_method :eql?, :==

  def hash
    [type, value].hash
  end
end
