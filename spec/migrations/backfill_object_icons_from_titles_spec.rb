# frozen_string_literal: true
require "rails_helper"
require Rails.root.join("db/migrate/20260831120100_backfill_object_icons_from_titles")

# Production has no name collisions, so without this spec the skip path would
# ship completely unexercised -- and it runs unattended against self-hosted
# databases on boot, where an abort means a failed upgrade.
RSpec.describe BackfillObjectIconsFromTitles do
  fixtures :organizations, :spaces

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:another_space) { spaces(:is_stefans) }

  # The shims bypass validations and callbacks, which is exactly the state the
  # migration finds rows in.
  let(:documents) { described_class::Document }
  let(:tables) { described_class::Table }
  let(:spaces_table) { described_class::Space }

  around do |example|
    was_verbose = ActiveRecord::Migration.verbose
    ActiveRecord::Migration.verbose = false
    example.run
    ActiveRecord::Migration.verbose = was_verbose
  end

  def create_document(id, title)
    documents.create!(id: id, title: title, organization_id: organization.id, space_id: space.id)
  end

  def create_table_row(id, name, in_space: nil)
    in_space ||= space
    tables.create!(
      id: id, name: name,
      organization_id: organization.id, space_id: in_space.id,
      parent_id: in_space.id, parent_type: "Space"
    )
  end

  def create_space_row(id, name, in_organization: nil)
    spaces_table.create!(
      id: id, name: name,
      organization_id: (in_organization || organization).id,
      hierarchy: [], access_mode: 0
    )
  end

  def migrate_up
    described_class.new.up
  end

  def migrate_down
    described_class.new.down
  end

  describe "#up" do
    context "with documents" do
      it "moves a leading emoji into the icon columns" do
        record = create_document("d1", "🔥 Hot Topic")

        migrate_up

        expect(record.reload).to have_attributes(title: "Hot Topic", icon_type: "emoji", icon_value: "🔥")
      end

      it "handles emoji the previous implementation could not recognize" do
        record = create_document("d2", "⭐ Roadmap")

        migrate_up

        expect(record.reload).to have_attributes(title: "Roadmap", icon_type: "emoji", icon_value: "⭐")
      end

      it "leaves a leading symbol that is not an emoji alone" do
        record = create_document("d3", "✓ Reviewed")

        migrate_up

        expect(record.reload).to have_attributes(title: "✓ Reviewed", icon_type: nil, icon_value: nil)
      end

      it "leaves an emoji-only title alone" do
        # 19 documents in production are titled exactly this.
        record = create_document("d4", "✅")

        migrate_up

        expect(record.reload).to have_attributes(title: "✅", icon_type: nil, icon_value: nil)
      end

      it "leaves a plain title alone" do
        record = create_document("d5", "Plain Title")

        migrate_up

        expect(record.reload).to have_attributes(title: "Plain Title", icon_type: nil, icon_value: nil)
      end

      it "does not bump updated_at, so 'recently updated' is not reshuffled" do
        record = create_document("d6", "🔥 Hot Topic")
        before = record.reload.updated_at

        migrate_up

        expect(record.reload.updated_at).to eq(before)
      end

      it "is idempotent" do
        record = create_document("d7", "🔥 Hot Topic")

        migrate_up
        migrate_up

        expect(record.reload).to have_attributes(title: "Hot Topic", icon_value: "🔥")
      end
    end

    context "when stripping would duplicate a name in the same scope" do
      it "leaves the emoji-prefixed table alone" do
        emoji_named = create_table_row("t1", "🔥 Notes")
        plain_named = create_table_row("t2", "Notes")

        migrate_up

        expect(emoji_named.reload).to have_attributes(name: "🔥 Notes", icon_type: nil, icon_value: nil)
        expect(plain_named.reload).to have_attributes(name: "Notes", icon_type: nil)
      end

      it "lets the first of two colliding candidates win and skips the second" do
        first = create_table_row("t3", "🔥 Docs")
        second = create_table_row("t4", "⭐ Docs")

        migrate_up

        expect(first.reload).to have_attributes(name: "Docs", icon_value: "🔥")
        expect(second.reload).to have_attributes(name: "⭐ Docs", icon_type: nil)
      end

      it "does not treat a same-named row in a different space as a collision" do
        create_table_row("t5", "Notes", in_space: another_space)
        emoji_named = create_table_row("t6", "🔥 Notes")

        migrate_up

        expect(emoji_named.reload).to have_attributes(name: "Notes", icon_value: "🔥")
      end

      it "applies the same rule to spaces, scoped by organization" do
        emoji_named = create_space_row("s1", "🔥 Team")
        create_space_row("s2", "Team")

        migrate_up

        expect(emoji_named.reload).to have_attributes(name: "🔥 Team", icon_type: nil)
      end

      it "leaves the database able to satisfy its unique indexes" do
        create_table_row("t7", "🔥 Notes")
        create_table_row("t8", "Notes")

        expect { migrate_up }.not_to raise_error
      end
    end

    it "reports what it skipped" do
      create_table_row("t9", "🔥 Notes")
      create_table_row("t10", "Notes")
      create_document("d8", "✅")
      migration = described_class.new
      messages = []
      allow(migration).to receive(:say) { |message, *| messages << message }

      migration.up

      expect(messages).to include(a_string_matching(/emoji-only title/))
      expect(messages).to include(a_string_matching(/duplicated an existing name/))
      expect(messages).to include(a_string_matching(/t9/))
    end
  end

  describe "#down" do
    it "puts the emoji back on the front of the title" do
      record = create_document("d9", "🔥 Hot Topic")
      migrate_up

      migrate_down

      expect(record.reload).to have_attributes(title: "🔥 Hot Topic", icon_type: nil, icon_value: nil)
    end

    it "round-trips tables" do
      record = create_table_row("t11", "📊 Metrics")
      migrate_up

      migrate_down

      expect(record.reload).to have_attributes(name: "📊 Metrics", icon_type: nil, icon_value: nil)
    end

    it "leaves rows that were never touched alone" do
      record = create_document("d10", "✓ Reviewed")
      migrate_up

      migrate_down

      expect(record.reload.title).to eq("✓ Reviewed")
    end
  end
end
