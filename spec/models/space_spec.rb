require 'rails_helper'

RSpec.describe Space, type: :model do
  describe "hierarchy" do
    it do
      new_hierarchy = Space.new.remove_document_from_hierarchy(23, [
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 23, "children" => [{ "id" => 24, "children" => [
          { "id" => 26, "children" => [] }
        ] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])

      # The document with id 23 is removed, children are moved level up
      expect(new_hierarchy).to eq([
        { "id" => 16, "children" => [] },
        { "id" => 18, "children" => [] },
        { "id" => 24, "children" => [{ "id" => 26, "children" => [] }] },
        { "id" => 19, "children" => [{ "id" => 20, "children" => [] }] },
        { "id" => 22, "children" => [{ "id" => 25, "children" => [] }] }
      ])
    end
  end
end