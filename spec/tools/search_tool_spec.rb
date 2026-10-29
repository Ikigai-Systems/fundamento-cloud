require "rails_helper"

RSpec.describe SearchTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :tags, :object_tags

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  def search(**args)
    response = SearchTool.call(**args, server_context: server_context)
    JSON.parse(response.content.first[:text])
  end

  def titles(result) = result["objects"].map { |object| object["title"] }

  describe ".call" do
    let!(:roadmap) { Document.create!(organization:, space:, title: "Product Roadmap", updated_at: 3.days.ago) }
    let!(:checklist) { Document.create!(organization:, space:, title: "Roadmap checklist", updated_at: 1.day.ago) }
    let!(:table) { Table.create!(organization:, space:, name: "Roadmap items", updated_at: 2.days.ago) }

    it "finds documents and tables by a title substring, prefix matches first" do
      result = search(query: "roadmap")

      expect(titles(result)).to eq(["Roadmap checklist", "Roadmap items", "Product Roadmap"])
    end

    it "returns what is needed to link to each hit" do
      object = search(query: "Product Roadmap")["objects"].first

      expect(object).to include(
        "id" => roadmap.id,
        "object_type" => "Document",
        "title" => "Product Roadmap",
        "space_id" => space.id,
        "mention" => %(<span data-mention="document" data-entity-id="#{roadmap.id}">Product Roadmap</span>)
      )
    end

    it "gives a table mention the table entity" do
      object = search(query: "Roadmap items", object_types: ["Table"])["objects"].first

      expect(object).to include(
        "object_type" => "Table",
        "title" => "Roadmap items",
        "mention" => %(<span data-mention="table" data-entity-id="#{table.id}">Roadmap items</span>)
      )
    end

    it "escapes the title in the mention snippet" do
      Document.create!(organization:, space:, title: "A <b> & B")

      object = search(query: "A <b>")["objects"].first

      expect(object["mention"]).to eq(%(<span data-mention="document" data-entity-id="#{Document.find_by!(title: "A <b> & B").id}">A &lt;b&gt; &amp; B</span>))
    end

    it "limits the object types" do
      expect(titles(search(query: "roadmap", object_types: ["Table"]))).to eq(["Roadmap items"])
    end

    it "treats LIKE wildcards in the query literally" do
      expect(search(query: "%%")["objects"]).to be_empty
    end

    it "filters by tags without a query" do
      result = search(tags: ["#status/wip"], object_types: ["Document"])

      expect(result["objects"].map { |object| object["id"] }).to eq([documents(:one).id])
    end

    it "requires all of the given tags" do
      result = search(tags: ["#status/wip", "#does/not-exist"], object_types: ["Document"])

      expect(result["objects"]).to be_empty
    end

    it "filters by update time" do
      expect(titles(search(query: "roadmap", object_types: ["Document"], updated_after: 2.days.ago.iso8601))).to eq(["Roadmap checklist"])
      expect(titles(search(query: "roadmap", object_types: ["Document"], updated_before: 2.days.ago.iso8601))).to eq(["Product Roadmap"])
    end

    it "limits to a space" do
      other = Space.create!(organization:, name: "Elsewhere")
      Document.create!(organization:, space: other, title: "Roadmap elsewhere")

      expect(titles(search(query: "roadmap", space_id: other.id))).to eq(["Roadmap elsewhere"])
    end

    it "pages through results" do
      first = search(query: "roadmap", limit: 2)
      second = search(query: "roadmap", limit: 2, offset: 2)

      expect(titles(first)).to eq(["Roadmap checklist", "Roadmap items"])
      expect(titles(second)).to eq(["Product Roadmap"])
      expect(first["total"]).to eq(3)
    end

    it "excludes archived documents" do
      roadmap.update!(archived: true)

      expect(titles(search(query: "roadmap"))).not_to include("Product Roadmap")
    end

    it "does not return other organizations' documents" do
      other_org = Organization.create!(name: "Other")
      other_space = Space.create!(organization: other_org, name: "Theirs")
      Document.create!(organization: other_org, space: other_space, title: "Roadmap secret")

      expect(titles(search(query: "roadmap"))).not_to include("Roadmap secret")
    end

    it "rejects a search with no criteria" do
      response = SearchTool.call(server_context: server_context)

      expect(response.error?).to be(true)
    end

    it "rejects a query shorter than two characters" do
      response = SearchTool.call(query: "r", server_context: server_context)

      expect(response.error?).to be(true)
    end

    it "rejects an unparseable date" do
      response = SearchTool.call(updated_after: "yesterday-ish", server_context: server_context)

      expect(response.error?).to be(true)
    end
  end
end
