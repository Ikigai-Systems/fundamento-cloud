require "rails_helper"

RSpec.describe "Api::V1::Search", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :tags, :object_tags

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  let!(:token) do
    ApiToken.create!(
      organization: organization,
      organization_membership: organization_memberships(:om_is_pawel),
      title: "Test API Token for Pawel at IS"
    )
  end

  let(:headers) { { "Authorization" => "Bearer #{token.encrypted_token}" } }

  describe "GET /api/v1/search" do
    let!(:roadmap) { Document.create!(organization:, space:, title: "Product Roadmap") }
    let!(:table) { Table.create!(organization:, space:, name: "Roadmap items") }

    it "finds documents and tables by title" do
      get api_v1_search_path, params: { query: "roadmap" }, headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["total"]).to eq(2)
      expect(json["objects"].map { |object| object["id"] }).to contain_exactly(roadmap.id, table.id)
      expect(json["objects"].first).to include("object_type", "title", "mention", "space_id", "updated_at")
    end

    it "accepts list parameters" do
      get api_v1_search_path, params: { tags: ["#status/wip"], object_types: ["Document"] }, headers: headers

      expect(JSON.parse(response.body)["objects"].map { |object| object["id"] }).to eq([documents(:one).id])
    end

    it "answers 422 with the reason when the search is invalid" do
      get api_v1_search_path, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to include("Provide at least one")
    end

    it "answers 404 for an unknown space" do
      get api_v1_search_path, params: { query: "roadmap", space_id: "nope" }, headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it "requires authentication" do
      get api_v1_search_path, params: { query: "roadmap" }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
