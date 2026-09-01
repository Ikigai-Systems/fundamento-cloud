class BackfillObjectIconsFromTitles < ActiveRecord::Migration[8.1]
  # Local shims rather than the real models: Document#title returns "Untitled"
  # for a blank title, Table and Space validate name presence and uniqueness,
  # and all three have callbacks and audit hooks that have no business running
  # during a backfill. These also insulate the migration from later model drift.
  class Document < ActiveRecord::Base
    self.table_name = "documents"
  end

  class Table < ActiveRecord::Base
    self.table_name = "tables"
  end

  class Space < ActiveRecord::Base
    self.table_name = "spaces"
  end

  # Cheap SQL pre-filter for rows worth running the RGI matcher over. It
  # deliberately over-matches (any leading non-alphanumeric character), so it is
  # a superset of what Icon.split_leading will actually accept -- correctness
  # comes from Ruby, this only keeps us from loading every row on large
  # databases. Postgres matches Unicode letters under [[:alnum:]], so titles in
  # non-Latin scripts are correctly excluded.
  LEADING_SYMBOL = "^[^[:alnum:][:space:]]".freeze

  TARGETS = [
    # klass, attribute holding the title, column the name must be unique within
    [Document, :title, nil],
    [Table, :name, :space_id],
    [Space, :name, :organization_id]
  ].freeze

  def up
    TARGETS.each { |klass, attribute, unique_within| backfill(klass, attribute, unique_within) }
  end

  # Genuinely reversible: putting the emoji back on the front of the title can
  # only make a name more unique, never less.
  def down
    TARGETS.each do |klass, attribute, _unique_within|
      klass.where(icon_type: Icon::EMOJI).find_each do |record|
        restored = [record.icon_value, record.read_attribute(attribute).presence].compact.join(" ")
        record.update_columns(attribute => restored, :icon_type => nil, :icon_value => nil)
      end
    end
  end

  private

  def backfill(klass, attribute, unique_within)
    candidates = klass.where(icon_type: nil).where("#{attribute} ~ ?", LEADING_SYMBOL)
    taken = names_in_use(klass, attribute, unique_within, candidates)

    updated = 0
    emoji_only = 0
    collisions = []

    candidates.find_each do |record|
      current = record.read_attribute(attribute)
      emoji, rest = Icon.split_leading(current)
      next if emoji.nil?

      # An emoji-only title would strip to "", which Table and Space reject and
      # which would turn a Document into "Untitled". Leave it as the title.
      if rest.blank?
        emoji_only += 1
        next
      end

      if unique_within
        scope_value = record.read_attribute(unique_within)
        names = (taken[scope_value] ||= Set.new)

        if names.include?(rest)
          collisions << "#{record.id} (#{current.inspect})"
          next
        end

        names.delete(current)
        names << rest
      end

      record.update_columns(attribute => rest, :icon_type => Icon::EMOJI, :icon_value => emoji)
      updated += 1
    end

    report(klass, updated, emoji_only, collisions)
  end

  # Every name already present in each affected scope, so we collide neither with
  # a row we are not touching nor with another row we are about to rename.
  def names_in_use(klass, attribute, unique_within, candidates)
    return {} if unique_within.nil?

    scope_values = candidates.distinct.pluck(unique_within)
    return {} if scope_values.empty?

    klass.where(unique_within => scope_values)
         .pluck(unique_within, attribute)
         .each_with_object({}) { |(scope_value, name), acc| (acc[scope_value] ||= Set.new) << name }
  end

  def report(klass, updated, emoji_only, collisions)
    say "#{klass.table_name}: moved a leading emoji into icon_value for #{updated} row(s)"
    say "#{klass.table_name}: left #{emoji_only} emoji-only title(s) alone", true if emoji_only.positive?

    return if collisions.empty?

    say "#{klass.table_name}: left #{collisions.size} row(s) alone -- stripping would have " \
        "duplicated an existing name:", true
    collisions.each { |collision| say collision, true }
  end
end
