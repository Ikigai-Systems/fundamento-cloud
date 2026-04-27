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
          params: { formula: "1 + 2" },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq(3)
        expect(json_response["commands"]).to eq([])
        expect(json_response["error"]).to be_nil
      end

      it "evaluates a string formula" do
        post api_v1_formulas_eval_path,
          params: { formula: 'Concatenate("hello", " ", "world")' },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq("hello world")
      end

      it "evaluates a formula with space_id" do
        post api_v1_formulas_eval_path,
          params: { formula: "5 * 5", space_id: is_default_space.id },
          headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq(25)
      end

      it "returns error for invalid formula" do
        post api_v1_formulas_eval_path,
          params: { formula: "InvalidFunction((((" },
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

      context "with table references" do
        fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

        it "looks up a table by name when space_id is provided" do
          post api_v1_formulas_eval_path,
            params: { formula: "Table(\"Projects\")", space_id: is_default_space.id },
            headers: auth_headers

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["result"]).to be_an(Array)
        end

        it "looks up a table by id" do
          post api_v1_formulas_eval_path,
            params: { formula: "Table(\"#{tables_tables(:projects).id}\")" },
            headers: auth_headers

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["result"]).to be_an(Array)
        end

        it "returns error when table name is ambiguous across spaces (no space_id)" do
          Table.create!(
            id: "duplicate_projects",
            name: tables_tables(:projects).name,
            organization: ikigai_systems,
            space: spaces(:is_stefans),
            parent: spaces(:is_stefans)
          )

          post api_v1_formulas_eval_path,
            params: { formula: "Table(\"#{tables_tables(:projects).name}\")" },
            headers: auth_headers

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response).to have_key("error")
          expect(json_response["error"]).to match(/Multiple tables/i)
        end
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
