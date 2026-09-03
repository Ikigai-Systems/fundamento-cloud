require "zlib"
require "digest"
require "tempfile"

# Serialises a table's current state into the gzipped JSON payload attached to a
# Tables::Version.
#
# The format is a positional matrix -- cells[i][j] is rows[i] x columns[j] -- which is
# the most compact honest JSON for a grid and carries row and column order for free.
# Row and column NPIs are preserved so a restore can put the original ids back: column
# widths in AdvancedTable's viewProps and formulas both key off column ids.
#
# Building streams rather than materialising: a 50,000 x 200 table is 10 million cells,
# which as a Ruby array-of-arrays is roughly a gigabyte. Rows are walked in chunks and
# written straight into the gzip stream.
module Tables
  class SnapshotBuilder
    FORMAT_VERSION = 1

    # Chunks are sized in cells, not rows, so a 200-column table does not pull 200x more
    # per chunk than a 5-column one. ROW_CHUNK_SIZE caps how many rows a narrow table
    # gathers at once.
    CELLS_PER_CHUNK = 50_000
    ROW_CHUNK_SIZE = 2_000

    Result = Struct.new(:io, :digest, :row_count, :column_count, :byte_size, keyword_init: true)

    def initialize(table, chunk_size: nil)
      @table = table
      @chunk_size = chunk_size
    end

    def build
      # Jobs and requests run inside an executor with the ActiveRecord query cache on,
      # which would retain every chunk's rows for the lifetime of the build -- hundreds of
      # megabytes on a large table, defeating the point of chunking.
      Tables::Cell.uncached { build_uncached }
    end

    private

    def build_uncached
      columns = table.columns_in_order
      row_ids = ordered_row_ids

      file = Tempfile.new(["table-snapshot", ".json.gz"], binmode: true)
      digest = Digest::SHA256.new
      gzip = Zlib::GzipWriter.new(file)

      write = lambda do |string|
        digest.update(string)
        gzip.write(string)
      end

      write.call(%({"format":#{FORMAT_VERSION},"columns":))
      write.call(JSON.generate(columns.map { |column| column_payload(column) }))
      write.call(%(,"rows":))
      write.call(JSON.generate(row_ids))
      write.call(%(,"cells":[))

      first = true
      row_ids.each_slice(chunk_size_for(columns.size)) do |chunk|
        values = cell_values_for(chunk)

        chunk.each do |row_id|
          write.call(",") unless first
          first = false

          by_column = values[row_id] || {}
          write.call(JSON.generate(columns.map { |column| by_column[column.id] }))
        end
      end

      write.call("]}")

      # #finish, not #close: it flushes the gzip trailer without closing the Tempfile.
      gzip.finish
      file.rewind

      Result.new(
        io: file,
        digest: digest.hexdigest,
        row_count: row_ids.size,
        column_count: columns.size,
        byte_size: file.size,
      )
    end

    attr_reader :table, :chunk_size

    def chunk_size_for(column_count)
      return chunk_size if chunk_size

      [[CELLS_PER_CHUNK / [column_count, 1].max, ROW_CHUNK_SIZE].min, 1].max
    end

    # Resolves the row linked list from plain id pairs rather than ActiveRecord objects:
    # at 50,000 rows the objects alone are tens of megabytes, and nothing here needs them.
    # Raises the same IndexError as Table#order_linked_list on a broken chain.
    def ordered_row_ids
      pairs = table.rows.pluck(:id, :previous_row_id)
      return [] if pairs.empty?

      first_id = nil
      next_by_previous = {}

      pairs.each do |id, previous_id|
        if previous_id.nil?
          first_id = id
        else
          next_by_previous[previous_id] = id
        end
      end

      ordered = [first_id]
      ordered << next_by_previous[ordered.last] while next_by_previous.key?(ordered.last)

      raise IndexError, "Incomplete linked list" if first_id.nil? || ordered.size != pairs.size

      ordered
    end

    def cell_values_for(row_ids)
      Tables::Cell
        .where(table_id: table.id, row_id: row_ids)
        .pluck(:row_id, :column_id, :value)
        .each_with_object({}) do |(row_id, column_id, value), result|
          (result[row_id] ||= {})[column_id] = value
        end
    end

    def column_payload(column)
      {
        "id" => column.id,
        "name" => column.name,
        "kind" => column.kind,
        "options" => column.options,
        "configuration" => column.configuration,
        "formula" => column.formula,
      }
    end
  end
end
