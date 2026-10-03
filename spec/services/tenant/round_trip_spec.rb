require "rails_helper"

# The whole-archive assertion: export a tenant, delete it, put it back, export again, and
# require the two archives to agree table by table.
#
# Every other spec here checks one thing at a time against sparse fixtures. This one is the only
# thing that would notice a table being silently dropped, a column arriving mangled, or a
# reference pointing somewhere new -- which is how all three of the bugs this work has produced
# so far actually presented.
RSpec.describe "tenant archive round trip" do
  # Deliberately everything there is a fixture for: the point of this spec is breadth, and a
  # table with no rows proves nothing about its restore path.
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables", "tables/columns", "tables/rows", "tables/cells",
           "tables/change_events", :object_contents, :versions, :object_comments,
           :object_reactions, :api_tokens, :attachments, :tags, :object_tags, :object_references,
           :favorites, :teams, :team_memberships, :public_links, :document_editing_sessions,
           :import_sessions, :import_files, :automations, :automation_invocations, :packs,
           :pack_versions, :invited_users, :oauth_applications, :oauth_access_grants,
           :oauth_access_tokens, :active_storage_blobs, :active_storage_attachments,
           :active_storage_variant_records

  let(:organization) { organizations(:is) }

  # Columns that cannot survive a round trip by design, and why.
  #
  #   id on an integer-keyed table -- dropped on insert so the sequence reassigns it.
  #   an IdMap::REMAPPED column    -- rewritten to point at whatever the new id turned out to be.
  #   a REDACTED column            -- never in the archive in the first place.
  def volatile_columns(table)
    columns = Tenant::ExportBuilder::REDACTED.fetch(table, []).dup
    columns += Tenant::IdMap::REMAPPED.filter_map { |t, column, _| column if t == table }
    columns << "id" if integer_keyed?(table)
    columns
  end

  def integer_keyed?(table)
    ActiveRecord::Base.connection.columns(table).find { |c| c.name == "id" }&.type == :integer
  end

  # table => rows in a deterministic order. Sorted on a rendered key rather than the hash
  # itself, because rows carry nils and mixed types and Array#<=> gives up on those.
  def contents(reader)
    reader.tables.to_h do |table|
      volatile = volatile_columns(table)
      rows = reader.each_row(table).map { |row| row.except(*volatile) }

      [table, rows.sort_by { |row| row.sort.map { |key, value| "#{key}=#{value.inspect}" }.join("\x1f") }]
    end
  end

  def export
    builder = Tenant::ExportBuilder.new(organization).build
    begin
      yield Tenant::ExportReader.new(builder.io)
    ensure
      builder.io&.close!
    end
  end

  it "puts a deleted tenant back exactly as it was" do
    before_rows = export { |reader| contents(reader) }

    expect(before_rows.values.sum(&:size)).to be > 50,
      "the fixtures are too sparse for this to mean anything"

    result = export do |reader|
      organization.destroy!
      Tenant::RestoreService.new(organization: organization, reader: reader).call
    end

    after_rows = export { |reader| contents(reader) }

    # Compared per table so a failure names the table rather than dumping the whole archive.
    expect(after_rows.keys).to match_array(before_rows.keys)

    before_rows.each do |table, rows|
      next if result.withheld.key?(table)

      expect(after_rows[table]).to eq(rows), "#{table} did not survive the round trip"
    end

    # The exceptions, and they are deliberate: a credential whose secret the archive drops
    # cannot come back, so the restore withholds the whole table and says so. Asserted here
    # rather than quietly excluded, because the day this list grows is a day somebody should
    # have to think about it.
    expect(result.withheld.keys)
      .to match_array(%w[api_tokens invited_users oauth_access_grants oauth_access_tokens])

    result.withheld.each_key do |table|
      expect(before_rows.fetch(table)).to be_present, "#{table} had no rows to withhold"
      expect(result.inserted[table].to_i).to eq(0), "#{table} was put back without its secret"
    end
  end

  it "withholds every table whose secret the export redacts, not just the ones that would fail to insert" do
    export do |reader|
      plan = Tenant::RestorePlanner.new(organization: organization, reader: reader).call
      carried = reader.tables.select { |table| reader.each_row(table).any? }

      expect(plan.withheld.keys).to match_array(Tenant::ExportBuilder::REDACTED.keys & carried)
    end
  end

  # The property the whole matching apparatus exists for. A restore that is not idempotent is a
  # restore nobody can run twice, and an operator working an incident will run it twice.
  it "inserts nothing the second time it is run" do
    export do |reader|
      organization.destroy!
      Tenant::RestoreService.new(organization: organization, reader: reader).call
    end

    second = export do |reader|
      Tenant::RestoreService.new(organization: organization, reader: reader).call
    end

    inserted = second.inserted.reject { |_, count| count.to_i.zero? }

    expect(inserted).to eq({}),
      "a second restore duplicated rows in #{inserted.keys.join(', ')}"
  end

  # Phase A's result, stated as a test. The moment a table arrives with an integer key and no
  # unique index, a restore starts duplicating it instead of recognising it -- silently.
  it "can match every table in the archive" do
    export do |reader|
      plan = Tenant::RestorePlanner.new(organization: organization, reader: reader).call

      expect(plan.unmatchable).to eq([]),
        "a restore cannot recognise rows in #{plan.unmatchable.join(', ')}; " \
        "see .claude/rules/tenant-archive.md"
    end
  end
end
