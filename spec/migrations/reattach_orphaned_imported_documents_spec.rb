# frozen_string_literal: true
require "rails_helper"
require Rails.root.join("db/migrate/20260905073815_reattach_orphaned_imported_documents")

# This runs unattended against self-hosted databases on boot, where an abort means a failed
# upgrade -- and it did abort in production, because it originally called
# Space#insert_hierarchy_node!, which had since grown a dependency on a column added by a
# later migration. The shims exercised here are the frozen replacements.
RSpec.describe ReattachOrphanedImportedDocuments do
  fixtures :organizations, :users, :spaces, :organization_memberships

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  let(:documents) { described_class::Document }
  let(:spaces_table) { described_class::Space }
  let(:import_sessions) { described_class::ImportSession }
  let(:import_files) { described_class::ImportFile }

  around do |example|
    was_verbose = ActiveRecord::Migration.verbose
    ActiveRecord::Migration.verbose = false
    example.run
    ActiveRecord::Migration.verbose = was_verbose
  end

  def create_session(path_map: {})
    import_sessions.create!(
      organization_id: organization.id, space_id: space.id,
      organization_membership_id: membership.id,
      status: 4, source_format: "obsidian", path_map: path_map,
      expires_at: 1.day.from_now
    )
  end

  def create_document(id, title)
    documents.create!(id: id, title: title, organization_id: organization.id, space_id: space.id)
  end

  def create_import_file(session, path, document_id, status: 4, file_type: 0)
    import_files.create!(
      import_session_id: session.id, relative_path: path, format: "markdown",
      file_type: file_type, status: status, document_id: document_id
    )
  end

  def hierarchy
    spaces_table.find(space.id).hierarchy
  end

  def set_hierarchy(nodes)
    spaces_table.where(id: space.id).update_all(["hierarchy = ?::json", nodes.to_json])
  end

  def migrate_up
    described_class.new.up
  end

  describe "#up" do
    it "appends a root-level orphan to the hierarchy" do
      create_document("orphan1", "Loose note")
      create_import_file(create_session, "Loose note.md", "orphan1")

      migrate_up

      expect(hierarchy).to eq([{ "id" => "orphan1", "children" => [] }])
    end

    it "nests an orphan under the parent directory's document" do
      create_document("parent1", "Notes")
      create_document("orphan2", "Nested note")
      set_hierarchy([{ "id" => "parent1", "children" => [] }])
      session = create_session(path_map: { "Notes" => "parent1" })
      create_import_file(session, "Notes/Nested note.md", "orphan2")

      migrate_up

      expect(hierarchy).to eq([
        { "id" => "parent1", "children" => [{ "id" => "orphan2", "children" => [] }] }
      ])
    end

    it "falls back to the root when the parent is itself missing from the hierarchy" do
      # The other half of the original bug: a lost parent node made add_item_to_hierarchy!
      # return nil, and the child was discarded rather than appended.
      create_document("orphan3", "Nested note")
      session = create_session(path_map: { "Notes" => "vanished_parent" })
      create_import_file(session, "Notes/Nested note.md", "orphan3")

      migrate_up

      expect(hierarchy).to eq([{ "id" => "orphan3", "children" => [] }])
    end

    it "leaves documents that are already in the hierarchy alone" do
      create_document("attached1", "Already there")
      set_hierarchy([{ "id" => "attached1", "children" => [] }])
      create_import_file(create_session, "Already there.md", "attached1")

      expect { migrate_up }.not_to change { hierarchy }
    end

    it "finds an orphan nested deeper in the tree" do
      create_document("top", "Top")
      create_document("mid", "Mid")
      create_document("orphan4", "Deep note")
      set_hierarchy([{ "id" => "top", "children" => [{ "id" => "mid", "children" => [] }] }])
      session = create_session(path_map: { "Top/Mid" => "mid" })
      create_import_file(session, "Top/Mid/Deep note.md", "orphan4")

      migrate_up

      expect(hierarchy.dig(0, "children", 0, "children")).to eq([{ "id" => "orphan4", "children" => [] }])
    end

    it "skips a document that has since moved to another space" do
      # The FK on import_files.document_id is RESTRICT, so the document cannot vanish while
      # the import row references it -- but it can be moved out of the space the session
      # imported into, and its node does not belong in this space's hierarchy.
      create_document("moved1", "Moved note")
      create_import_file(create_session, "Moved note.md", "moved1")
      documents.where(id: "moved1").update_all(space_id: spaces(:is_stefans).id)

      expect { migrate_up }.not_to change { hierarchy }
    end

    it "ignores attachments and files that did not complete" do
      create_document("att1", "Photo")
      create_document("failed1", "Broken")
      session = create_session
      create_import_file(session, "photo.png", "att1", file_type: 1)
      create_import_file(session, "Broken.md", "failed1", status: 5)

      expect { migrate_up }.not_to change { hierarchy }
    end

    it "is idempotent" do
      create_document("orphan5", "Loose note")
      create_import_file(create_session, "Loose note.md", "orphan5")

      migrate_up
      expect { migrate_up }.not_to change { hierarchy }
    end
  end
end
