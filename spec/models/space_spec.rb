require 'rails_helper'

RSpec.describe Space, type: :model do
  describe "#remove_single_item_from_hierarchy!" do
    it "removes only one item and moves children level up" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      item_removed = Space.new.remove_single_item_from_hierarchy!(23, hierarchy)

      # The document with id 23 is removed, children are moved level up
      expect(item_removed).to be_truthy
      expect(hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 24, "children" => [{ "id" => 26, "children" => [] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "removes only one item" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      item_removed = Space.new.remove_single_item_from_hierarchy!(16, hierarchy)

      expect(item_removed).to be_truthy
      expect(hierarchy).to eq([
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "returns false it item was not found" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      item_removed = Space.new.remove_single_item_from_hierarchy!(666, hierarchy)

      # The document with id 23 is removed, children are moved level up
      expect(item_removed).to be_falsey
      expect(hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end
  end

  describe "#remove_item_with_children_from_hierarchy!" do
    it "removes only one item and returns it with children" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      removed_item = Space.new.remove_item_with_children_from_hierarchy!(23, hierarchy)

      # The document with id 23 is removed, children are moved level up
      expect(removed_item).to eq({ "id" => 23, "children" => [{ "id" => 24, "children" => [
        { "id" => 26, "children" => [] }
      ] }] })

      expect(hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "removes only one item" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      removed_item = Space.new.remove_item_with_children_from_hierarchy!(16, hierarchy)

      expect(removed_item).to eq({ "id" => 16, "children" => [] })

      expect(hierarchy).to eq([
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "returns nil if item was not found" do
      hierarchy = [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      removed_item = Space.new.remove_item_with_children_from_hierarchy!(666, hierarchy)

      expect(removed_item).to be_nil

      expect(hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end
  end

  describe "#add_item_to_hierarchy!" do
    it "adds element on the first position" do
      hierarchy = [
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      insert_item = { "id" => 16, "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, 0)

      expect(hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "adds element on the second position" do
      hierarchy = [
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      insert_item = { "id" => 16, "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, 1)

      expect(hierarchy).to eq([
        { "id" => 18, "children" => [] },
        { "id" => 16, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end

    it "adds element on the last position" do
      hierarchy = [
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      insert_item = { "id" => 16, "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, nil, insert_item, nil)

      expect(hierarchy).to eq([
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] },
        { "id" => 16, "children" => [] },
      ])
    end

    it "adds element under another" do
      hierarchy = [
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ]

      insert_item = { "id" => 16, "children" => [] }

      Space.new.add_item_to_hierarchy!(hierarchy, 26, insert_item, 0)

      expect(hierarchy).to eq([
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [
            { "id" => 16, "children" => [] },
          ] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end
  end
end