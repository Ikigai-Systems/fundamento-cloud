require "rails_helper"

RSpec.describe Tenant::ExportReader do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:archive) { Tenant::ExportBuilder.new(organization).build }

  subject(:reader) { described_class.new(archive.io) }

  after { archive.io&.close! }

  it "reads the manifest" do
    expect(reader.manifest["organization_id"]).to eq(organization.id)
    expect(reader.format_version).to eq(Tenant::ExportBuilder::FORMAT_VERSION)
  end

  it "yields a table's rows" do
    ids = reader.each_row("documents").map { _1["id"] }

    expect(ids).to match_array(organization.all_documents.pluck(:id))
  end

  it "yields nothing for a table the archive does not contain" do
    expect(reader.each_row("nonexistent_table").to_a).to eq([])
  end

  it "can read the same table twice" do
    first = reader.each_row("documents").map { _1["id"] }
    second = reader.each_row("documents").map { _1["id"] }

    expect(second).to eq(first)
  end

  # An archive written by a newer version of the exporter may mean anything at all --
  # columns dropped, a different redaction policy, a changed traversal. Guessing is worse
  # than refusing, because the guess is only discovered after it has been restored.
  it "refuses an archive from a format it does not know" do
    allow_any_instance_of(described_class).to receive(:manifest)
      .and_return({ "format_version" => Tenant::ExportBuilder::FORMAT_VERSION + 1 })

    expect { reader.format_version! }
      .to raise_error(Tenant::ExportReader::UnsupportedFormat, /format_version/)
  end
end
