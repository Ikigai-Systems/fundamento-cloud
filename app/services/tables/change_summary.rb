# Condenses the change events a version covers into the counts the history list renders,
# so browsing the timeline never has to load the events themselves.
module Tables
  class ChangeSummary
    def self.for(events)
      new(events).to_h
    end

    def initialize(events)
      @events = events
      @by_kind = events.group_by(&:kind)
    end

    def to_h
      {
        "events" => events.size,
        "cells_changed" => distinct_cells("cell_updated"),
        "rows_added" => distinct("row_inserted", "row_id"),
        "rows_deleted" => distinct("row_deleted", "row_id"),
        "rows_moved" => distinct("row_moved", "row_id"),
        "columns_added" => distinct("column_added", "column_id"),
        "columns_removed" => distinct("column_removed", "column_id"),
        "imported" => count("bulk_imported").positive?,
        "restored" => count("restored").positive?,
        "structure" => structure_descriptions,
      }
    end

    private

    attr_reader :events, :by_kind

    def count(kind) = by_kind.fetch(kind, []).size

    # Counts of things, not of events: one cell edited several times is one cell changed,
    # which is what someone reading the history wants to know.
    def distinct(kind, key)
      by_kind.fetch(kind, []).map { |event| event.payload[key] }.uniq.size
    end

    def distinct_cells(kind)
      by_kind.fetch(kind, [])
             .map { |event| [event.payload["row_id"], event.payload["column_id"]] }
             .uniq
             .size
    end

    # Structural changes are the ones worth spelling out; cell edits are just a number.
    def structure_descriptions
      events.filter_map { |event| describe(event) }.uniq.first(10)
    end

    def describe(event)
      payload = event.payload

      case event.kind
      when "column_added"        then %(added "#{payload["name"]}")
      when "column_removed"      then %(removed "#{payload["name"]}")
      when "column_renamed"      then %(renamed "#{payload["before"]}" to "#{payload["after"]}")
      when "column_retyped"      then %(changed "#{payload["name"]}" to #{payload["after"]})
      when "column_reconfigured" then %(reconfigured "#{payload["name"]}")
      when "column_moved"        then %(moved "#{payload["name"]}")
      end
    end
  end
end
