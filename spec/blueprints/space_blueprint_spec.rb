require "rails_helper"

RSpec.describe SpaceBlueprint do
  fixtures :organizations, :spaces, :documents

  describe ".render_as_hash" do
    it "returns a nested id/npi/title/children shape for a two-level hierarchy" do
      space = spaces(:is_default)
      space.update!(hierarchy: [
        { "id" => documents(:one).id, "children" => [
          { "id" => documents(:two).id, "children" => [] },
        ] },
      ])

      result = SpaceBlueprint.render_as_hash(space, view: :with_documents)

      expect(result[:documents]).to eq([
        {
          id: documents(:one).id,
          npi: documents(:one).id,
          title: documents(:one).title,
          children: [
            {
              id: documents(:two).id,
              npi: documents(:two).id,
              title: documents(:two).title,
              children: [],
            },
          ],
        },
      ])
    end

    it "promotes the children of an orphaned hierarchy entry" do
      # Space#documents_from_hierarchy no longer splices orphans out in memory before we
      # get here, so this has to be handled at render time — as SpaceSidebarTree does.
      space = spaces(:is_default)
      space.update!(hierarchy: [
        { "id" => "does-not-exist", "children" => [
          { "id" => documents(:one).id, "children" => [] },
        ] },
      ])

      result = SpaceBlueprint.render_as_hash(space, view: :with_documents)

      expect(result[:documents]).to eq([
        {
          id: documents(:one).id,
          npi: documents(:one).id,
          title: documents(:one).title,
          children: [],
        },
      ])
    end

    it "returns an empty tree when every entry is orphaned" do
      space = spaces(:is_default)
      space.update!(hierarchy: [{ "id" => "does-not-exist", "children" => [] }])

      result = SpaceBlueprint.render_as_hash(space, view: :with_documents)

      expect(result[:documents]).to eq([])
    end
  end
end
