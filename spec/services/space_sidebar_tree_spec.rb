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

  it "labels an emoji-only title with an empty string so the emoji is not rendered twice" do
    one.update!(title: "\u{1F525}")
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    # The emoji is already shown as the node's icon; using it as the label as well (which is what
    # a `.presence` fallback to the full title would do) duplicates it.
    expect(result["nodes"].first["title"]).to eq("")
    expect(result["nodes"].first["emoji"]).to eq("\u{1F525}")
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

  it "omits fields that are at their default" do
    space.update!(hierarchy: [node(one)])

    payload = described_class.new(space: space, can_update_space: true).as_json
    leaf = payload["nodes"].first

    expect(leaf).not_to have_key("children")
    expect(leaf).not_to have_key("emoji")
    expect(leaf).not_to have_key("archived")
    expect(leaf).to have_key("id")
    expect(leaf).to have_key("title")
  end

  it "still emits fields that are not at their default" do
    one.update!(title: "🔥 Hot", archived: true)
    space.update!(hierarchy: [node(one, [node(two)])])

    leaf = described_class.new(space: space, can_update_space: true).as_json["nodes"].first

    expect(leaf["emoji"]).to eq("🔥")
    expect(leaf["archived"]).to be(true)
    expect(leaf["children"].map { _1["id"] }).to eq([two.id])
  end

  it "does not load the sync blob when building the tree" do
    space.update!(hierarchy: [node(one)])

    selected = nil
    ActiveSupport::Notifications.subscribed(->(*, payload) {
      selected = payload[:sql] if payload[:sql].to_s.include?("FROM \"documents\"")
    }, "sql.active_record") do
      described_class.new(space: space, can_update_space: true).as_json
    end

    expect(selected).to be_present
    expect(selected).not_to include("documents\".\"sync")
    expect(selected).not_to match(/SELECT\s+"?documents"?\.\*/)
  end
end
