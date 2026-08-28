require "rails_helper"

RSpec.describe SpaceSidebarTree do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:space) { spaces(:is_default) }
  let(:one) { documents(:one) }
  let(:two) { documents(:two) }

  def node(document, children = [])
    { "id" => document.id, "children" => children }
  end

  it "builds a nested tree of the space's documents" do
    space.update!(hierarchy: [node(one, [node(two)])])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["spaceId"]).to eq(space.id)
    expect(result["canUpdateSpace"]).to be(true)
    expect(result["nodes"].length).to eq(1)
    expect(result["nodes"].first["id"]).to eq(one.id)
    expect(result["nodes"].first["children"].map { _1["id"] }).to eq([two.id])
  end

  it "splits the emoji out of the title" do
    one.update!(title: "🔥 Hot Topic")
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["title"]).to eq("Hot Topic")
    expect(result["nodes"].first["emoji"]).to eq("🔥")
  end

  it "promotes children of a hierarchy entry whose document no longer exists" do
    space.update!(hierarchy: [{ "id" => "does-not-exist", "children" => [node(two)] }])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].map { _1["id"] }).to eq([two.id])
  end

  it "drops a draft document and its whole subtree when the user cannot update the space" do
    space.update!(hierarchy: [node(one, [node(two)])])

    result = described_class.new(space: space, can_update_space: false).as_json

    expect(result["nodes"]).to eq([])
  end

  it "keeps draft documents when the user can update the space" do
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["draft"]).to be(true)
  end

  it "marks archived documents" do
    one.update!(archived: true)
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["archived"]).to be(true)
  end
end
