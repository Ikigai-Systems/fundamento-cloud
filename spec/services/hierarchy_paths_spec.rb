require "rails_helper"

RSpec.describe HierarchyPaths do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:space) { spaces(:is_default) }
  let(:one) { documents(:one) }
  let(:two) { documents(:two) }

  def node(document, children = [])
    {"id" => document.id, "children" => children}
  end

  def paths_for(*documents, spaces: [space])
    described_class.new(spaces: spaces, document_ids: documents.map(&:id))
  end

  def sql_queries
    queries = []
    ActiveSupport::Notifications.subscribed(->(*, payload) {
      queries << payload[:sql] unless payload[:name] == "SCHEMA"
    }, "sql.active_record") { yield }
    queries
  end

  it "returns an empty path for a document at the root of the hierarchy" do
    space.update!(hierarchy: [node(one)])

    expect(paths_for(one).path_for(one.id)).to eq("")
  end

  it "joins the ancestor titles, with a trailing separator" do
    three = space.documents.create!(title: "Three", organization: space.organization)
    space.update!(hierarchy: [node(one, [node(two, [node(three)])])])

    expect(paths_for(three).path_for(three.id)).to eq("One › Two › ")
  end

  it "returns an empty path for a document that is not in the hierarchy at all" do
    space.update!(hierarchy: [])

    expect(paths_for(one).path_for(one.id)).to eq("")
  end

  it "returns an empty path for an id it was never asked about" do
    space.update!(hierarchy: [node(one, [node(two)])])

    expect(paths_for(two).path_for(one.id)).to eq("")
  end

  it "skips an ancestor whose document no longer exists rather than truncating the path" do
    three = space.documents.create!(title: "Three", organization: space.organization)
    space.update!(hierarchy: [node(one, [node(two, [node(three)])])])
    two.destroy!

    expect(paths_for(three).path_for(three.id)).to eq("One › ")
  end

  it "falls back to Untitled for an ancestor with no title" do
    two.update_column(:title, nil)
    space.update!(hierarchy: [node(one, [node(two)])])

    expect(paths_for(two).path_for(two.id)).to eq("One › ")
    expect(paths_for(one, two).path_for(two.id)).to eq("One › ")
  end

  it "tolerates a space with an empty hierarchy" do
    space.update!(hierarchy: [])

    expect { paths_for(one).path_for(one.id) }.not_to raise_error
  end

  it "issues no queries when there are no documents to resolve" do
    space.update!(hierarchy: [node(one, [node(two)])])

    queries = sql_queries { described_class.new(spaces: [space], document_ids: []).path_for(one.id) }

    expect(queries).to be_empty
  end

  it "resolves ancestors across several spaces in a single query" do
    other_space = organizations(:is).spaces.create!(name: "Other", access_mode: :public)
    other_parent = other_space.documents.create!(title: "Other Parent", organization: organizations(:is))
    other_child = other_space.documents.create!(title: "Other Child", organization: organizations(:is))

    space.update!(hierarchy: [node(one, [node(two)])])
    other_space.update!(hierarchy: [node(other_parent, [node(other_child)])])

    paths = described_class.new(spaces: [space, other_space], document_ids: [two.id, other_child.id])

    queries = sql_queries do
      expect(paths.path_for(two.id)).to eq("One › ")
      expect(paths.path_for(other_child.id)).to eq("Other Parent › ")
    end

    expect(queries.count { |sql| sql.include?('FROM "documents"') }).to eq(1)
  end
end
