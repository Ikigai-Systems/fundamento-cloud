require "zlib"
require "rubygems/package"

# Reads an archive written by Tenant::ExportBuilder.
#
# Deliberately refuses a format version it does not know. An archive from a newer exporter
# may differ in any number of ways -- a column dropped, a different redaction policy, a
# changed traversal -- and a guess about which is only discovered after it has been
# restored. Same contract as Tables::SnapshotReader.
module Tenant
  class ExportReader
    class UnsupportedFormat < StandardError; end

    SUPPORTED_FORMAT_VERSIONS = [Tenant::ExportBuilder::FORMAT_VERSION].freeze

    def initialize(io)
      @io = io
    end

    def manifest
      @manifest ||= JSON.parse(read_entry("manifest.json").to_s)
    end

    def format_version
      manifest["format_version"]
    end

    # Call before doing anything with the contents.
    def format_version!
      return format_version if SUPPORTED_FORMAT_VERSIONS.include?(format_version)

      raise UnsupportedFormat,
        "archive format_version #{format_version.inspect} is not one this version can read " \
        "(#{SUPPORTED_FORMAT_VERSIONS.join(', ')})"
    end

    def organization_id = manifest["organization_id"]

    def row_counts = manifest["row_counts"] || {}

    # Yields each row of a table as a hash. Returns an enumerator without a block, so a
    # caller can count or sample without materialising the table.
    def each_row(table)
      return enum_for(:each_row, table) unless block_given?

      payload = read_entry("data/#{table}.jsonl.gz")
      return if payload.nil?

      Zlib::GzipReader.new(StringIO.new(payload)).each_line do |line|
        next if line.strip.empty?

        yield JSON.parse(line)
      end
    end

    def tables
      @tables ||= scan_names.filter_map { |name| name[%r{\Adata/(.+)\.jsonl\.gz\z}, 1] }.sort
    end

    private

    attr_reader :io

    # Rewinds every time rather than caching entries. An archive is read a table at a time
    # and the whole point of the layout is not holding one in memory; caching the payloads
    # here would undo that on the caller's behalf.
    def read_entry(path)
      io.rewind
      Gem::Package::TarReader.new(io) do |tar|
        tar.each { |entry| return entry.read if entry.full_name == path }
      end
      nil
    end

    def scan_names
      io.rewind
      names = []
      Gem::Package::TarReader.new(io) { |tar| tar.each { |entry| names << entry.full_name } }
      names
    end
  end
end
