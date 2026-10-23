# frozen_string_literal: true
require "rails_helper"
require Rails.root.join("db/migrate/20261022201826_drop_packs")

# Runs on boot for self-hosted installs, against whatever pack rows and bundles they still have.
RSpec.describe DropPacks do
  fixtures :organizations

  let(:connection) { ActiveRecord::Base.connection }
  let(:organization) { organizations(:is) }

  around do |example|
    was_verbose = ActiveRecord::Migration.verbose
    ActiveRecord::Migration.verbose = false
    example.run
    ActiveRecord::Migration.verbose = was_verbose
  end

  # The tables as they stood before this migration. DDL is transactional in Postgres, so the
  # example's rollback removes them again.
  before do
    connection.create_table :packs, id: :string do |t|
      t.string :active_version_id
      t.string :name, null: false
      t.string :organization_id, null: false
      t.timestamps
    end
    connection.create_table :pack_versions, id: :string do |t|
      t.string :organization_id, null: false
      t.string :pack_id, null: false
      t.integer :version, null: false
      t.timestamps
    end
    connection.add_foreign_key :pack_versions, :packs
    connection.add_foreign_key :packs, :pack_versions, column: :active_version_id

    connection.execute(<<~SQL)
      INSERT INTO packs (id, name, organization_id, created_at, updated_at)
        VALUES ('old_pack', 'Pack', #{connection.quote(organization.id)}, now(), now());
      INSERT INTO pack_versions (id, pack_id, version, organization_id, created_at, updated_at)
        VALUES ('old_pack_v1', 'old_pack', 1, #{connection.quote(organization.id)}, now(), now());
      UPDATE packs SET active_version_id = 'old_pack_v1';
    SQL
  end

  def blob(key)
    ActiveStorage::Blob.create!(key: key, filename: "bundle.json", content_type: "application/json",
      byte_size: 2, checksum: "ZGF0YQ==", service_name: "test")
  end

  def attach(blob, record_type, record_id)
    ActiveStorage::Attachment.insert!({ name: "bundle", record_type: record_type, record_id: record_id,
      blob_id: blob.id, created_at: Time.current })
  end

  it "drops both tables" do
    described_class.new.migrate(:up)

    expect(connection.table_exists?(:packs)).to be(false)
    expect(connection.table_exists?(:pack_versions)).to be(false)
  end

  it "removes the bundles' attachment rows and purges blobs nothing else uses" do
    bundle = blob("pack-bundle")
    attach(bundle, "PackVersion", "old_pack_v1")

    expect { described_class.new.migrate(:up) }
      .to have_enqueued_job(ActiveStorage::PurgeJob).with(bundle)

    expect(ActiveStorage::Attachment.where(record_type: "PackVersion")).to be_empty
  end

  it "keeps a blob that is still attached elsewhere" do
    shared = blob("shared-blob")
    attach(shared, "PackVersion", "old_pack_v1")
    attach(shared, "Attachment", "some_attachment")

    expect { described_class.new.migrate(:up) }.not_to have_enqueued_job(ActiveStorage::PurgeJob)

    expect(ActiveStorage::Attachment.where(blob_id: shared.id).pluck(:record_type)).to eq(["Attachment"])
  end
end
