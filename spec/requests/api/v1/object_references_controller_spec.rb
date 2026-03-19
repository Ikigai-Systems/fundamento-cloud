require "rails_helper"

RSpec.describe "Api::V1::ObjectReferences", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }
  let(:document_one) { documents(:one) }
  let(:document_two) { documents(:two) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test API Token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" } }

  describe "GET /api/v1/documents/:document_id/object_references" do
    it "returns current object_references for a document" do
      om = ObjectReference.create!(
        source_node_id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: document_two.id,
        title: "Two",
        current: true,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_references",
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["object_references"].length).to eq(1)
      expect(json["object_references"][0]["id"]).to eq(om.source_node_id)
      expect(json["object_references"][0]["target_type"]).to eq("Document")
      expect(json["object_references"][0]["target_id"]).to eq(document_two.id)
      expect(json["object_references"][0]["title"]).to eq("Two")
    end

    it "includes broken mentions in response" do
      ObjectReference.create!(
        source_node_id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: nil,
        title: "Missing Doc",
        current: true,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_references",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_references"][0]["target_id"]).to be_nil
      expect(json["object_references"][0]["title"]).to eq("Missing Doc")
    end

    it "excludes non-current mentions" do
      ObjectReference.create!(
        source_node_id: SecureRandom.uuid,
        source: document_one,
        target_type: "Document",
        target_id: document_two.id,
        title: "Old",
        current: false,
        organization: ikigai_systems
      )

      get "/api/v1/documents/#{document_one.id}/object_references",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_references"]).to be_empty
    end

    it "returns empty array for document with no mentions" do
      get "/api/v1/documents/#{document_one.id}/object_references",
        headers: auth_headers

      json = JSON.parse(response.body)
      expect(json["object_references"]).to eq([])
    end

    it "returns unauthorized without authentication" do
      get "/api/v1/documents/#{document_one.id}/object_references"

      expect(response).to have_http_status(:unauthorized)
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_membership) { organization_memberships(:om_hc_pawel) }
      let!(:other_token) do
        ApiToken.create!(
          organization: other_org,
          organization_membership: other_membership,
          title: "Other Org Token"
        )
      end

      it "returns not found when accessing document from different organization" do
        get "/api/v1/documents/#{document_one.id}/object_references",
          headers: { "Authorization" => "Bearer #{other_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
