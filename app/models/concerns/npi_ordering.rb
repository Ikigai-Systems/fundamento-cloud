# frozen_string_literal: true

# Concern for models that have been migrated to use NPI (string) primary keys.
# This sets implicit_order_column to :created_at so that .first, .last, etc.
# order by creation time instead of alphabetical NPI order.
#
# Include this in models after migrating their primary key from integer to NPI.
module NpiOrdering
  extend ActiveSupport::Concern

  included do
    self.implicit_order_column = :created_at
  end
end
