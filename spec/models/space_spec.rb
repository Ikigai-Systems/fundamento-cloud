require 'rails_helper'

RSpec.describe Space, type: :model do
  fixtures :organizations, :spaces

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      space = spaces(:is_default)
      expect(space.id).to be_a(String)
      expect(space.id.length).to be >= 10
    end

    it "has string space_id in child documents" do
      space = Space.create!(
        id: "testspace1",
        name: "Test Space",
        organization: organizations(:is)
      )

      document = space.documents.create!(
        title: "Test Document",
        organization: organizations(:is)
      )

      expect(document.space_id).to be_a(String)
      expect(document.space_id).to eq(space.id)
      expect(document.space_id).to eq("testspace1")
    end

    it "has string space_id in child tables" do
      space = Space.create!(
        id: "testspace2",
        name: "Test Space 2",
        organization: organizations(:is)
      )

      document = space.documents.create!(
        title: "Parent Document",
        organization: organizations(:is)
      )

      table = space.tables.create!(
        name: "Test Table",
        organization: organizations(:is),
        parent: document
      )

      expect(table.space_id).to be_a(String)
      expect(table.space_id).to eq(space.id)
      expect(table.space_id).to eq("testspace2")
    end
  end

  let(:hierarchy) do
    [
      { "id" => "doc_16", "children" => [] },
      { "id" => "doc_18", "children" => [] },
      { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
        { "id" => "doc_26", "children" => [] }
      ] }] },
      { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
      { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
    ]
  end

  let(:hierarchy_1) do
    [
      { "id" => "doc_16", "children" => [] },
      { "id" => "doc_18", "children" => [] },
      { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
        { "id" => "doc_26", "children" => [] },
        { "id" => "doc_28", "children" => [] },
        { "id" => "doc_29", "children" => [] },
      ] }] },
      { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
      { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
    ]
  end

  describe "#remove_single_item_from_hierarchy!" do
    it "removes only one item and moves children level up" do
      item_removed = Space.new.remove_single_item_from_hierarchy!("doc_23", hierarchy)

      # The document with id doc_23 is removed, children are moved level up
      expect(item_removed).to be_truthy
      expect(hierarchy).to eq([
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_24", "children" => [{ "id" => "doc_26", "children" => [] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "removes only one item" do
      item_removed = Space.new.remove_single_item_from_hierarchy!("doc_16", hierarchy)

      expect(item_removed).to be_truthy
      expect(hierarchy).to eq([
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "returns false it item was not found" do
      item_removed = Space.new.remove_single_item_from_hierarchy!("doc_666", hierarchy)

      # The document with id doc_23 is removed, children are moved level up
      expect(item_removed).to be_falsey
      expect(hierarchy).to eq([
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end
  end

  describe "#remove_item_with_children_from_hierarchy!" do
    it "removes only one item and returns it with children" do
      removed_item = Space.new.remove_item_with_children_from_hierarchy!("doc_23", hierarchy)

      # The document with id doc_23 is removed, children are moved level up
      expect(removed_item).to eq({ "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
        { "id" => "doc_26", "children" => [] }
      ] }] })

      expect(hierarchy).to eq([
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "removes only one item" do
      hierarchy = [
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      removed_item = Space.new.remove_item_with_children_from_hierarchy!("doc_16", hierarchy)

      expect(removed_item).to eq({ "id" => "doc_16", "children" => [] })

      expect(hierarchy).to eq([
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "returns nil if item was not found" do
      hierarchy = [
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      removed_item = Space.new.remove_item_with_children_from_hierarchy!("doc_666", hierarchy)

      expect(removed_item).to be_nil

      expect(hierarchy).to eq([
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end
  end

  describe "#add_item_to_hierarchy!" do
    it "adds element on the first position" do
      hierarchy = [
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      insert_item = { "id" => "doc_16", "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, 0)

      expect(hierarchy).to eq([
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "adds element on the second position" do
      hierarchy = [
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      insert_item = { "id" => "doc_16", "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, 1)

      expect(hierarchy).to eq([
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_16", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end

    it "adds element on the last position" do
      hierarchy = [
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      insert_item = { "id" => "doc_16", "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, nil)

      expect(hierarchy).to eq([
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] },
        { "id" => "doc_16", "children" => [] },
      ])
    end

    it "adds element under another" do
      hierarchy = [
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ]

      insert_item = { "id" => "doc_16", "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, "doc_26", insert_item, 0)

      expect(hierarchy).to eq([
        { "id" => "doc_18", "children" => [] },
        { "id" => "doc_23", "children" => [{ "id" => "doc_24", "children" => [
          { "id" => "doc_26", "children" => [
            { "id" => "doc_16", "children" => [] },
          ] }
        ] }] },
        { "id" => "doc_19", "children" => [{ "id" => "doc_20", "children" => [] }] },
        { "id" => "doc_22", "children" => [{ "id" => "doc_25", "children" => [] }] }
      ])
    end
  end

  describe "#get_children_ids_from_hierarchy" do
    it do
      expect(Space.new.get_children_ids_from_hierarchy("doc_16", hierarchy)).to eq []
      expect(Space.new.get_children_ids_from_hierarchy("doc_23", hierarchy)).to eq ["doc_24"]
      expect(Space.new.get_children_ids_from_hierarchy("doc_24", hierarchy)).to eq ["doc_26"]
      expect(Space.new.get_children_ids_from_hierarchy("doc_26", hierarchy)).to eq []
      expect(Space.new.get_children_ids_from_hierarchy("doc_666", hierarchy)).to be_nil
    end

    it do
      expect(Space.new.get_children_ids_from_hierarchy("doc_16", hierarchy_1)).to eq []
      expect(Space.new.get_children_ids_from_hierarchy("doc_23", hierarchy_1)).to eq ["doc_24"]
      expect(Space.new.get_children_ids_from_hierarchy("doc_24", hierarchy_1)).to eq ["doc_26", "doc_28", "doc_29"]
      expect(Space.new.get_children_ids_from_hierarchy("doc_26", hierarchy_1)).to eq []
      expect(Space.new.get_children_ids_from_hierarchy("doc_666", hierarchy_1)).to be_nil
    end
  end

  describe "#get_all_descendant_ids" do
    it "returns empty array for leaf node" do
      expect(Space.new.get_all_descendant_ids("doc_16", hierarchy)).to eq []
    end

    it "returns direct children" do
      expect(Space.new.get_all_descendant_ids("doc_23", hierarchy)).to eq ["doc_24", "doc_26"]
    end

    it "returns all descendants recursively" do
      expect(Space.new.get_all_descendant_ids("doc_24", hierarchy_1)).to eq ["doc_26", "doc_28", "doc_29"]
    end

    it "returns deeply nested descendants" do
      descendants = Space.new.get_all_descendant_ids("doc_23", hierarchy_1)
      expect(descendants).to include("doc_24", "doc_26", "doc_28", "doc_29")
      expect(descendants.length).to eq 4
    end

    it "returns empty array for non-existent document" do
      expect(Space.new.get_all_descendant_ids("doc_666", hierarchy)).to eq []
    end
  end

  describe "#documents_from_hierarchy" do
    fixtures :organizations, :users, :organization_memberships, :spaces, :documents

    let(:space) { spaces(:is_default) }

    it "returns only the documents that exist, ignoring orphaned entries" do
      space.update!(hierarchy: [
        { "id" => "does-not-exist", "children" => [{ "id" => documents(:one).id, "children" => [] }] }
      ])

      result = space.documents_from_hierarchy(scope: space.documents.select(:id, :title))

      expect(result.map(&:id)).to eq([documents(:one).id])
    end

    it "does not mutate the hierarchy" do
      # It used to splice orphans out in memory without saving — surprising for a reader,
      # redone on every render, and persistable by an unrelated later save.
      hierarchy = [
        { "id" => "does-not-exist", "children" => [{ "id" => documents(:one).id, "children" => [] }] }
      ]
      space.update!(hierarchy: hierarchy)

      expect {
        space.documents_from_hierarchy(scope: space.documents.select(:id, :title))
      }.not_to change { space.reload.hierarchy }

      expect(space.hierarchy).to eq(hierarchy)
    end

    it "uses the given scope for the lookup" do
      space.update!(hierarchy: [{ "id" => documents(:one).id, "children" => [] }])

      result = space.documents_from_hierarchy(scope: space.documents.select(:id, :title))

      expect(result.map(&:id)).to eq([documents(:one).id])
      expect { result.first.archived }.to raise_error(ActiveModel::MissingAttributeError)
    end
  end

  describe "#insert_hierarchy_node!" do
    fixtures :documents

    let(:space) { spaces(:is_default) }

    it "appends at the root when no parent is given" do
      space.insert_hierarchy_node!("doc_a")

      expect(space.reload.hierarchy).to eq([{ "id" => "doc_a", "children" => [] }])
    end

    it "nests under the parent when the parent is in the hierarchy" do
      space.update!(hierarchy: [{ "id" => "parent", "children" => [] }])

      space.insert_hierarchy_node!("doc_a", parent_id: "parent")

      expect(space.reload.hierarchy).to eq([
        { "id" => "parent", "children" => [{ "id" => "doc_a", "children" => [] }] }
      ])
    end

    it "never asks for FOR UPDATE on the spaces row" do
      # Callers insert a document first, which takes FOR KEY SHARE on this row to enforce
      # the foreign key. Asking for FOR UPDATE afterwards is a lock upgrade, and two
      # concurrent imports each holding KEY SHARE and each wanting UPDATE deadlock — a full
      # vault import produced a steady stream of PG::TRDeadlockDetected.
      space.update!(hierarchy: [])
      queries = []
      collect = ->(_name, _start, _finish, _id, payload) { queries << payload[:sql] }

      ActiveSupport::Notifications.subscribed(collect, "sql.active_record") do
        space.insert_hierarchy_node!("doc_a")
      end

      expect(queries).not_to include(a_string_matching(/FROM "spaces".*FOR UPDATE/m))
      expect(queries).to include(a_string_matching(/UPDATE "spaces".*hierarchy::jsonb =/m))
    end

    it "retries when another writer commits between the read and the write" do
      space.update!(hierarchy: [])

      # Someone else's node lands after we read but before we write, so our guarded UPDATE
      # matches nothing and we must re-read rather than overwrite them.
      Space.find(space.id).update!(hierarchy: [{ "id" => "other", "children" => [] }])
      allow(space).to receive(:current_hierarchy).and_return([], space.current_hierarchy)

      space.insert_hierarchy_node!("ours")

      expect(Space.find(space.id).hierarchy.map { _1["id"] }).to contain_exactly("other", "ours")
    end

    it "gives up rather than spinning forever if the row never settles" do
      space.update!(hierarchy: [])
      allow(space).to receive(:current_hierarchy).and_return([{ "id" => "never-committed", "children" => [] }])

      expect {
        space.insert_hierarchy_node!("ours")
      }.to raise_error(Space::ConcurrentHierarchyUpdate, /could not place ours/)
    end

    it "falls back to the root when the parent is missing from the hierarchy" do
      # add_item_to_hierarchy! returns nil here; without a fallback the node is dropped and
      # the document exists but never shows up in the sidebar.
      space.update!(hierarchy: [])

      space.insert_hierarchy_node!("doc_a", parent_id: "ghost_parent")

      expect(space.reload.hierarchy.map { _1["id"] }).to eq(["doc_a"])
    end
  end

  describe "#with_locked_hierarchy" do
    let(:space) { spaces(:is_default) }

    it "yields a freshly loaded instance rather than the receiver" do
      space.update!(hierarchy: [])

      yielded = nil
      space.with_locked_hierarchy { |locked| yielded = locked }

      expect(yielded).to be_a(Space)
      expect(yielded).not_to equal(space)
      expect(yielded.id).to eq(space.id)
    end

    it "does not clobber a node written after the receiver was loaded" do
      space.update!(hierarchy: [])
      space.hierarchy # warm this instance's copy

      # Stand-in for another worker: a separate instance commits its own node.
      Space.find(space.id).update!(hierarchy: [{ "id" => "written_elsewhere", "children" => [] }])

      space.with_locked_hierarchy { |locked| locked.hierarchy.append({ "id" => "ours", "children" => [] }) }

      expect(Space.find(space.id).hierarchy.map { _1["id"] })
        .to contain_exactly("written_elsewhere", "ours")
    end

    it "does not deadlock against the foreign-key lock taken by a document insert" do
      # Mirrors the ImportDocumentJob sequence: insert a document, then place it.
      space.update!(hierarchy: [])

      expect {
        ActiveRecord::Base.transaction do
          document = space.documents.create!(organization: space.organization, title: "New")
          space.insert_hierarchy_node!(document.id)
        end
      }.not_to raise_error

      expect(Space.find(space.id).hierarchy.size).to eq(1)
    end

    it "reloads the receiver so it doesn't keep serving a stale hierarchy" do
      space.update!(hierarchy: [])
      space.hierarchy

      space.with_locked_hierarchy { |locked| locked.hierarchy.append({ "id" => "ours", "children" => [] }) }

      expect(space.hierarchy.map { _1["id"] }).to eq(["ours"])
    end
  end

  describe ".with_locked_hierarchies" do
    let(:source) { spaces(:is_default) }
    let(:destination) { spaces(:is_stefans) }

    it "yields both spaces locked and saves both" do
      source.update!(hierarchy: [{ "id" => "doc_a", "children" => [] }])
      destination.update!(hierarchy: [])

      Space.with_locked_hierarchies(source, destination) do |from, to|
        item = from.remove_item_with_children_from_hierarchy!("doc_a")
        to.hierarchy.append(item)
      end

      expect(Space.find(source.id).hierarchy).to eq([])
      expect(Space.find(destination.id).hierarchy.map { _1["id"] }).to eq(["doc_a"])
    end

    it "yields the same instance twice when both spaces are the same" do
      source.update!(hierarchy: [{ "id" => "doc_a", "children" => [] }])

      Space.with_locked_hierarchies(source, source) do |from, to|
        expect(from).to equal(to)
        item = from.remove_item_with_children_from_hierarchy!("doc_a")
        to.hierarchy.append(item)
      end

      expect(Space.find(source.id).hierarchy.map { _1["id"] }).to eq(["doc_a"])
    end
  end
end