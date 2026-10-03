require "rails_helper"

# The eight tables a tenant restore could not previously match, and the identity each of them
# now has. A restore recognises a row it has seen before either by a string primary key, which
# an archive carries verbatim, or by a unique index over columns the archive preserves -- so if
# any of this drifts, restores silently start duplicating rows instead of failing.
RSpec.describe "stable identity for restorable tables" do
  CONVERTED_TO_NANOID_PK = [ApiToken, Attachment, AutomationInvocation, ObjectComment, PackVersion].freeze

  # No model file: the Doorkeeper tables are the gem's own classes.
  DOORKEEPER_TABLES = %w[oauth_access_grants oauth_access_tokens].freeze

  def column(table, name)
    ActiveRecord::Base.connection.columns(table).find { |c| c.name == name }
  end

  CONVERTED_TO_NANOID_PK.each do |model|
    describe model.name do
      it "has a string primary key" do
        expect(model.columns_hash["id"].type).to eq(:string)
      end

      it "generates a nanoid for it" do
        record = model.new
        record.send(:generate_id_if_needed)

        expect(record.id).to match(/\A[A-Za-z0-9_-]{10}\z/)
      end

      it "orders by created_at rather than by the random key" do
        expect(model.implicit_order_column).to eq(:created_at)
      end

      it "leaves no database default behind, so the application owns the id" do
        expect(column(model.table_name, "id").default_function).to be_nil
      end
    end
  end

  DOORKEEPER_TABLES.each do |table|
    describe table do
      it "has a string primary key" do
        expect(column(table, "id").type).to eq(:string)
      end

      # Doorkeeper::AccessToken inherits from ::ActiveRecord::Base, not this app's
      # ApplicationRecord, so generate_id_if_needed never runs for it. Without a database
      # default every insert would fail its NOT NULL -- including every OAuth sign-in.
      it "generates the id in the database, because the gem bypasses ApplicationRecord" do
        expect(column(table, "id").default_function).to eq("gen_random_uuid()")
      end
    end
  end

  describe "table_change_events, which kept its integer key" do
    # Nothing holds a change event's id, which is what makes the counter sufficient here and
    # insufficient for pack_versions -- an attachment held one of those.
    it "matches on its per-table counter" do
      expect(ActiveRecord::Base.connection.indexes("table_change_events"))
        .to include(have_attributes(columns: %w[table_id sequential_id], unique: true))
    end

    # A key containing `id` would be useless: a restore drops integer ids and lets the sequence
    # reassign them, so the archived value could never be found again.
    it "is not keyed on a column that a restore reassigns" do
      unique = ActiveRecord::Base.connection.indexes("table_change_events").select(&:unique)

      expect(unique).to be_present
      expect(unique.flat_map(&:columns)).not_to include("id")
    end

    it "is not pointed at by anything, which is why the counter is enough" do
      holders = ActiveRecord::Base.connection.tables.flat_map do |table|
        ActiveRecord::Base.connection.foreign_keys(table)
          .select { |fk| fk.to_table == "table_change_events" }
          .map { |fk| "#{table}.#{fk.column}" }
      end

      expect(holders).to eq([])
    end
  end

  describe "pack_versions" do
    # Kept even though the primary key is now the match key: a pack having two version 3s is
    # wrong regardless of restores, and PackVersion#set_version_number assigns it under an
    # advisory lock on that assumption.
    it "still declares its per-pack counter unique" do
      expect(ActiveRecord::Base.connection.indexes("pack_versions"))
        .to include(have_attributes(columns: %w[pack_id version], unique: true))
    end

    # The reason it got a string key rather than keeping the counter alone: this column is
    # polymorphic, so Tenant::IdMap -- whose entries name a single target table -- cannot rewrite
    # it, and a reassigned id left a restored pack without its bundle.
    it "is pointed at by a polymorphic column that no restore could have remapped" do
      expect(column("active_storage_attachments", "record_id").type).to eq(:string)
      expect(column("pack_versions", "id").type).to eq(:string)
    end
  end

  describe "object_comments' referencing columns" do
    it "widened object_references.source_comment_id to hold a nanoid" do
      expect(column("object_references", "source_comment_id").type).to eq(:string)
    end
  end
end
