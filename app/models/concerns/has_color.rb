# frozen_string_literal: true

# A label color for documents and tables, picked from a fixed set of eight.
#
#   document.assign_color("Indigo")
#   document.color # => "indigo"
#
# Names are the public form everywhere (API, MCP, React props); the integer only
# exists in the database, so a name can be renamed or restyled without a data
# migration.
module HasColor
  extend ActiveSupport::Concern

  # Append-only: the position in this list is what the database stores, so
  # reordering or removing a name would silently recolor existing records.
  NAMES = %w[crimson orange lime teal blue indigo magenta slate].freeze

  # The columns #color is built from. Queries that narrow their SELECT for
  # performance have to name them, so the list belongs to the concern, like
  # HasIcon::COLUMNS.
  COLUMNS = %i[color].freeze

  included do
    # prefix: true keeps the generated scopes and predicates (color_blue?) from
    # colliding with anything else on the model. allow_nil because most records
    # have no color; an unknown name then fails validation instead of raising.
    enum :color, NAMES.each_with_index.to_h, prefix: true, validate: {allow_nil: true}
  end

  # The API and MCP treat the color as a field of its own: nil leaves it alone,
  # "" removes it, a name sets it. Assigns without saving, and raises rather than
  # letting enum's validation turn a typo into a vague "is invalid".
  def assign_color(value)
    return if value.nil?

    value = value.to_s.strip.downcase
    if value.empty?
      self.color = nil
    elsif NAMES.include?(value)
      self.color = value
    else
      raise ArgumentError, "Color must be one of: #{NAMES.join(", ")}"
    end
  end
end
