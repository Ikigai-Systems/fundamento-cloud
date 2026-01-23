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
end