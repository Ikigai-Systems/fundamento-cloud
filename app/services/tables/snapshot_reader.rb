require "zlib"

# Reads back a Tables::Version snapshot, and reshapes it into exactly the payload
# Tables::TablesController#show serves for a live table, so the version viewer can reuse
# TableDataBlueprint and the existing rowstack grid without new serialisation code.
module Tables
  class SnapshotReader
    class UnsupportedFormat < StandardError; end

    def initialize(version)
      @version = version
    end

    def payload
      @payload ||= begin
        raise UnsupportedFormat, "version has no snapshot attached" unless version.snapshot.attached?

        parsed = JSON.parse(Zlib.gunzip(version.snapshot.download))
        raise UnsupportedFormat, "unknown snapshot format #{parsed["format"]}" unless parsed["format"] == SnapshotBuilder::FORMAT_VERSION

        parsed
      end
    end

    def columns
      @columns ||= payload["columns"].map do |attributes|
        Tables::Column.new(
          id: attributes["id"],
          name: attributes["name"],
          kind: attributes["kind"],
          options: attributes["options"],
          configuration: attributes["configuration"],
          formula: attributes["formula"],
          table_id: version.table_id,
          organization_id: version.organization_id,
        )
      end
    end

    def row_ids = payload["rows"]

    # Mirrors Table#data_to_json's shape, including its checkbox coercion. Formula
    # columns are left null: their values were never stored, and re-evaluating them now
    # would run against a workspace that has since changed.
    def rows
      row_ids.each_with_index.map do |row_id, row_index|
        values = payload["cells"][row_index] || []
        row = {}

        columns.each_with_index do |column, column_index|
          value = values[column_index]
          row[column.id] = column.kind == "checkbox" ? value == "t" : value
        end

        row["id"] = row_id
        row
      end
    end

    def to_table_data
      { columns: columns, rows: rows }
    end

    private

    attr_reader :version
  end
end
