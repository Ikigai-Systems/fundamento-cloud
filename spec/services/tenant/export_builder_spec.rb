require "rails_helper"
require "rubygems/package"

# The archive is the deliverable for three separate promises -- a backup we can restore
# from, a GDPR portability export, and what an offboarding customer takes with them -- so
# the properties that matter are the same in all three: it contains this tenant's rows,
# only this tenant's rows, and nothing secret.
RSpec.describe Tenant::ExportBuilder do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", :api_tokens

  let(:organization) { organizations(:is) }
  let(:other_organization) { organizations(:hc) }

  # Reads the archive back the way an operator would: open the tar, find the table's
  # JSONL, gunzip it, parse a row per line.
  def rows_for(result, table)
    entry = read_entry(result, "data/#{table}.jsonl.gz")
    return [] if entry.nil?

    Zlib::GzipReader.new(StringIO.new(entry)).read.each_line.map { JSON.parse(_1) }
  end

  def read_entry(result, path)
    result.io.rewind
    Gem::Package::TarReader.new(result.io) do |tar|
      tar.each { |entry| return entry.read if entry.full_name == path }
    end
    nil
  end

  def manifest(result)
    JSON.parse(read_entry(result, "manifest.json"))
  end

  subject(:result) { described_class.new(organization).build }

  after { result.io&.close! }

  it "includes the organization's own rows" do
    expect(rows_for(result, "documents").map { _1["id"] })
      .to match_array(organization.all_documents.pluck(:id))
  end

  # Asserted on spaces because the documents fixture has none for the other organization,
  # and a test that cannot see the thing it forbids proves nothing.
  it "excludes another organization's rows" do
    other_ids = other_organization.spaces.pluck(:id)
    expect(other_ids).not_to be_empty

    expect(rows_for(result, "spaces").map { _1["id"] }).not_to include(*other_ids)
    expect(rows_for(result, "spaces").map { _1["id"] }).to match_array(organization.spaces.pluck(:id))
  end

  it "records the format version and row counts in the manifest" do
    expect(manifest(result)["format_version"]).to eq(described_class::FORMAT_VERSION)
    expect(manifest(result)["organization_id"]).to eq(organization.id)
    expect(manifest(result)["row_counts"]["documents"]).to eq(organization.all_documents.count)
  end

  # A tenant archive that carries API tokens is a credential leak wearing the costume of a
  # backup: it gets copied to laptops, emailed to departing customers, and kept for
  # ninety days. The restore has to re-issue these rather than find a null and move on,
  # so the redaction is recorded rather than silent.
  it "redacts secrets and says that it did" do
    token_row = rows_for(result, "api_tokens").first
    expect(token_row).to be_present

    expect(token_row["encrypted_token"]).to be_nil
    expect(manifest(result)["redacted"]["api_tokens"]).to include("encrypted_token")
  end

  # Exercises every scope in the registry, including the tables no fixture populates.
  # Without this, the SQL for object_contents, the oauth tables and the active_storage
  # chain is never executed until production runs it, and a typo there is a failed export
  # at the moment somebody needs one.
  it "writes a file for every exported table, and its SQL runs" do
    missing = Tenant::TableRegistry.exported.reject do |table|
      read_entry(result, "data/#{table}.jsonl.gz")
    end

    expect(missing).to eq([]),
      "no data file written for: #{missing.join(', ')} -- the scope probably returned nil"
  end

  it "counts every exported table in the manifest" do
    expect(manifest(result)["row_counts"].keys).to match_array(Tenant::TableRegistry.exported)
  end

  it "never exports a global table" do
    Tenant::TableRegistry::GLOBAL.each do |table|
      expect(read_entry(result, "data/#{table}.jsonl.gz")).to be_nil,
        "#{table} is global and must not appear in a tenant archive"
    end
  end
end
