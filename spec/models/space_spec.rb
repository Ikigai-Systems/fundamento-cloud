require 'rails_helper'

RSpec.describe Space, type: :model do
  describe "#remove_single_item_from_hierarchy" do
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
end