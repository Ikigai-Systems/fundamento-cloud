# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Formulas", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test API Token for Pawel at IS"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" } }

  describe "POST /api/v1/formulas/eval" do
    context "with valid API token" do
      it "evaluates a simple arithmetic formula" do
        post api_v1_formulas_eval_path,
          params: { formula: "1 + 2", space_id: is_default_space.id },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq(3)
        expect(json_response["commands"]).to eq([])
      end

      it "evaluates a string formula" do
        post api_v1_formulas_eval_path,
          params: { formula: 'Concatenate("hello", " ", "world")', space_id: is_default_space.id },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq("hello world")
      end

      it "returns error for invalid formula" do
        post api_v1_formulas_eval_path,
          params: { formula: "InvalidFunction((((", space_id: is_default_space.id },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to have_key("error")
      end

      it "returns error when space_id is missing" do
        post api_v1_formulas_eval_path,
          params: { formula: "1 + 1" },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to have_key("error")
      end

      it "returns not found for nonexistent space" do
        post api_v1_formulas_eval_path,
          params: { formula: "1 + 1", space_id: "nonexistent" },
          headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        post api_v1_formulas_eval_path,
          params: { formula: "1 + 1" },
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        post api_v1_formulas_eval_path,
          params: { formula: "1 + 1" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
