require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  fixtures :organizations, :users, :organization_memberships

  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }

  let(:ikigai_systems) { organizations(:is) }
  let(:herocoders) { organizations(:hc) }
  
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }
  let(:stefan_ikigai_systems) { organization_memberships(:om_is_stefan) }
  let(:pawel_herocoders) { organization_memberships(:om_hc_pawel) }
  
  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test API Token for Pawel at IS"
    )
  end

  let!(:stefan_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: stefan_ikigai_systems,
      title: "Test API Token for Stefan at IS"
    )
  end

  let!(:pawel_hc_token) do
    ApiToken.create!(
      organization: herocoders,
      organization_membership: pawel_herocoders,
      title: "Test API Token for Pawel at HC"
    )
  end

  describe "GET /api/v1/users/:id" do
    context "with API token authentication" do
      context "with valid API token" do
        it "returns user data when accessing same organization user" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["id"]).to eq(pawel.id)
          expect(json_response["first_name"]).to eq("Pawel")
          expect(json_response["last_name"]).to eq("Wiadomski")
          expect(json_response["email"]).to eq("pawel@ikigai.systems")
        end

        it "returns user data when manager accesses member in same organization" do
          get "/api/v1/users/#{stefan.id}",
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["id"]).to eq(stefan.id)
          expect(json_response["first_name"]).to eq("Stefan")
        end

        it "updates api token used_at timestamp" do
          expect {
            get "/api/v1/users/#{pawel.id}",
              headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
          }.to change { pawel_is_token.reload.used_at }
        end
      end

      context "with invalid API token" do
        it "returns unauthorized with invalid token" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "Bearer invalid_token_123" }

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with malformed Bearer header" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "InvalidFormat #{pawel_is_token.encrypted_token}" }

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with missing Authorization header" do
          get "/api/v1/users/#{pawel.id}"

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with empty Authorization header" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "" }

          expect(response).to have_http_status(:unauthorized)
        end
      end

      context "with cross-organization access" do
        it "returns not found when accessing user from different organization" do
          get "/api/v1/users/#{users(:john).id}",
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

          expect(response).to have_http_status(:not_found)
          expect(response.body).to eq("'#{users(:john).id}' is invalid user reference")
        end
      end
    end

    context "authorization and error handling" do
      it "returns not found for non-existent user" do
        get "/api/v1/users/999999",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
        expect(response.body).to eq("'999999' is invalid user reference")
      end

      it "returns not found for user ID that exists but is not accessible due to authorization" do
        # This would test Pundit policy restrictions if they prevent access
        get "/api/v1/users/#{users(:john).id}",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
        expect(response.body).to eq("'#{users(:john).id}' is invalid user reference")
      end
    end
  end
end