# frozen_string_literal: true
require "rails_helper"

RSpec.describe "GET /search", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, "tables/tables"

  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  before do
    sign_in pawel
    post select_organization_path(organization)
  end

  def search(query)
    get search_path(format: :json, q: query)
    JSON.parse(response.body)
  end

  def titles(results)
    results.map { |result| result.dig("object", "title") }
  end

  def document(title, in_space: space)
    in_space.documents.create!(title: title, organization: organization)
  end

  describe "the query parameter" do
    it "returns nothing when no query is given" do
      expect(search(nil)).to eq([])
    end

    it "returns nothing for a query below the minimum length" do
      document("Onboarding")

      expect(search("O")).to eq([])
    end

    it "does not raise Pundit::AuthorizationNotPerformedError on the short-query path" do
      get search_path(format: :json, q: "")

      expect(response).to have_http_status(:ok)
    end
  end

  describe "what it matches" do
    it "finds a document by title, case-insensitively" do
      document("Onboarding Checklist")

      expect(titles(search("checklist"))).to include("Onboarding Checklist")
    end

    it "finds a table by name" do
      expect(titles(search("Users"))).to include("Users")
    end

    it "finds a space by name" do
      results = search("Default")

      expect(results.map { |r| r.dig("object", "type") }).to include("Space")
      expect(titles(results)).to include("Default IS")
    end

    it "does not return documents that do not match" do
      document("Onboarding Checklist")

      expect(titles(search("Roadmap"))).not_to include("Onboarding Checklist")
    end

    it "does not match a document on its space's name" do
      document("Onboarding Checklist")

      documents = search("Default").select { |r| r.dig("object", "type") == "Document" }

      expect(documents).to be_empty
    end

    it "does not match a document on its parent path" do
      parent = document("Handbook")
      child = document("Onboarding Checklist")
      space.update!(hierarchy: [{"id" => parent.id, "children" => [{"id" => child.id, "children" => []}]}])

      expect(titles(search("Handbook"))).not_to include("Onboarding Checklist")
    end
  end

  describe "LIKE metacharacters in the query" do
    it "treats % as a literal character" do
      document("100% Done")
      document("1000 Done")

      expect(titles(search("100%"))).to contain_exactly("100% Done")
    end

    it "treats _ as a literal character" do
      document("a_b")
      document("axb")

      expect(titles(search("a_b"))).to contain_exactly("a_b")
    end

    it "does not raise on a trailing backslash" do
      document("back\\slash")

      expect { search("back\\") }.not_to raise_error
    end
  end

  describe "the payload shape" do
    it "sends exactly the keys the command palette reads" do
      document("Onboarding Checklist")

      result = search("checklist").first

      expect(result.keys).to match_array(%w[object space])
      expect(result["object"].keys).to match_array(%w[id title icon parent_path type])
      expect(result["space"].keys).to eq(%w[name])
    end

    it "sends the containing space's name for a document" do
      document("Onboarding Checklist")

      expect(search("checklist").first.dig("space", "name")).to eq("Default IS")
    end

    it "sends a nil space name for a space, so the palette does not repeat it" do
      result = search("Default").find { |r| r.dig("object", "type") == "Space" }

      expect(result.dig("space", "name")).to be_nil
    end
  end

  describe "parent_path" do
    it "joins the ancestor titles with a trailing separator" do
      grandparent = document("Handbook")
      parent = document("Onboarding")
      child = document("Checklist")
      space.update!(hierarchy: [{
        "id" => grandparent.id,
        "children" => [{"id" => parent.id, "children" => [{"id" => child.id, "children" => []}]}]
      }])

      expect(search("Checklist").first.dig("object", "parent_path")).to eq("Handbook › Onboarding › ")
    end

    it "is empty for a document at the root" do
      root = document("Checklist")
      space.update!(hierarchy: [{"id" => root.id, "children" => []}])

      expect(search("Checklist").first.dig("object", "parent_path")).to eq("")
    end

    it "is empty for a table, which has no position in the document tree" do
      result = search("Users").find { |r| r.dig("object", "type") == "Table" }

      expect(result.dig("object", "parent_path")).to eq("")
    end
  end

  describe "archived objects" do
    it "excludes an archived document" do
      document("Onboarding Checklist").update!(archived: true)

      expect(titles(search("checklist"))).to be_empty
    end

    it "excludes an archived space" do
      expect(titles(search("Archived"))).to be_empty
    end

    it "excludes documents in an archived space, even for a manager" do
      archived = spaces(:is_archived)
      archived.documents.create!(title: "Archived Checklist", organization: organization)

      expect(organization.organization_memberships.find_by(user: pawel)).to be_manager
      expect(titles(search("Archived Checklist"))).to be_empty
    end
  end

  describe "authorization" do
    it "excludes documents from another organization" do
      other = organizations(:hc)
      spaces(:hc_default).documents.create!(title: "Foreign Checklist", organization: other)

      expect(titles(search("Foreign"))).to be_empty
    end

    it "excludes documents in a private space the user is not a member of" do
      sign_in stefan
      post select_organization_path(organization)
      private_space = organization.spaces.create!(name: "Locked Room", access_mode: :private)
      private_space.documents.create!(title: "Secret Checklist", organization: organization)

      expect(titles(search("Secret"))).to be_empty
    end
  end

  describe "limits and ranking" do
    it "caps the number of results per type" do
      30.times { |i| document("Checklist #{i}") }

      results = search("Checklist").select { |r| r.dig("object", "type") == "Document" }

      expect(results.length).to eq(SearchesController::PER_TYPE_LIMIT)
    end

    it "ranks an exact match above a prefix match above a substring match" do
      document("Q3 pre-launch roadmap")
      document("Roadmap for 2026")
      document("Roadmap")

      expect(titles(search("Roadmap")).first(3)).to eq(["Roadmap", "Roadmap for 2026", "Q3 pre-launch roadmap"])
    end
  end

  describe "query efficiency" do
    def queries_for(&block)
      queries = []
      ActiveSupport::Notifications.subscribed(->(*, payload) {
        queries << payload[:sql] unless payload[:name] == "SCHEMA" || payload[:sql].start_with?("BEGIN", "COMMIT")
      }, "sql.active_record", &block)
      queries
    end

    it "never loads the sync blob" do
      document("Onboarding Checklist")

      queries = queries_for { search("checklist") }
      document_queries = queries.select { |sql| sql.include?('FROM "documents"') }

      expect(document_queries).to be_present
      expect(document_queries).to all(satisfy { |sql| !sql.include?('documents"."sync') })
      expect(document_queries).to all(satisfy { |sql| !sql.match?(/SELECT\s+"?documents"?\.\*/) })
    end

    it "issues the same number of queries for one result as for many" do
      document("Checklist 0")
      one_result = queries_for { search("Checklist") }.length

      24.times { |i| document("Checklist #{i + 1}") }
      many_results = queries_for { search("Checklist") }.length

      expect(many_results).to eq(one_result)
      expect(many_results).to be <= 8
    end
  end
end
