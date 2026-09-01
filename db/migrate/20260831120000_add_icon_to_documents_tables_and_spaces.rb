class AddIconToDocumentsTablesAndSpaces < ActiveRecord::Migration[8.1]
  def change
    # Icons used to be derived from the title on every read. They are now a
    # first-class attribute, normalized once on write.
    #
    # Two columns rather than one so the value stays cheap to SELECT in the
    # narrow sidebar tree query, and `icon_type` leaves room for a built-in
    # glyph set or an uploaded image later without re-touching render sites.
    %i[documents tables spaces].each do |table|
      add_column table, :icon_type, :string
      add_column table, :icon_value, :string
    end
  end
end
