# frozen_string_literal: true

# Substring search over the one column that holds an object's name, shared by every type
# the command palette can jump to.
#
#   class Document < ApplicationRecord
#     include TitleSearch
#     searchable_by :title
#   end
#
#   Document.matching_title("road")   # => "Roadmap" before "Product Roadmap"
#
# It exists so the LIKE escaping lives in exactly one place. `where.like` (the
# activerecord-like gem, used by Tables::TablesController#index) is injection-safe but does
# not escape LIKE wildcards, so a user typing "%" there matches every row.
module TitleSearch
  extend ActiveSupport::Concern

  # Below this, the palette shows only its static commands. Two characters of a nanoid-scale
  # corpus is nearly every row, and a trigram index cannot help a pattern this short anyway.
  MIN_QUERY_LENGTH = 2

  class_methods do
    # `column` must be the real column, like has_icon's `derived_from:` -- Table#title and
    # Space#title are read-only aliases for `name` with no matching column.
    def searchable_by(column)
      class_attribute :search_column, instance_writer: false, default: column
    end

    def matching_title(query)
      escaped = sanitize_sql_like(query.to_s.strip)
      return none if escaped.length < MIN_QUERY_LENGTH

      qualified = "#{table_name}.#{search_column}"

      where("#{qualified} ILIKE ?", "%#{escaped}%")
        # Postgres sorts false < true, so DESC puts prefix matches first: typing "check"
        # should surface "Checklist" above "Q3 pre-launch check". Recency breaks the tie,
        # matching the recently_updated scopes.
        .order(Arel.sql(sanitize_sql_array(
          ["(#{qualified} ILIKE ?) DESC", "#{escaped}%"]
        )))
        .order(updated_at: :desc)
    end
  end
end
