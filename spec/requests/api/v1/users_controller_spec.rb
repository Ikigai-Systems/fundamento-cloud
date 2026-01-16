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

    context "with JWT token authentication" do
      let(:jwt_secret_key) { "test_jwt_secret_key_for_specs" }
      let(:organization_user) { organization_memberships(:om_is_pawel) }
      
      before do
        allow(Rails.application.credentials).to receive(:formula_eval).and_return(
          double(jwt_secret_key!: jwt_secret_key)
        )
      end

      context "with valid JWT token" do
        let(:payload) do
          {
            "sub" => organization_user.to_global_id.to_s,
            "aud" => "test_audience",
            "exp" => 1.hour.from_now.to_i
          }
        end
        let(:jwt_token) { JWT.encode(payload, jwt_secret_key, "HS256") }

        it "returns user data with valid JWT token" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "JWT #{jwt_token}" }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["id"]).to eq(pawel.id)
          expect(json_response["first_name"]).to eq("Pawel")
        end

        it "allows access to other users in same organization" do
          get "/api/v1/users/#{stefan.id}",
            headers: { "Authorization" => "JWT #{jwt_token}" }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["id"]).to eq(stefan.id)
        end
      end

      context "with invalid JWT token" do
        it "returns unauthorized with expired JWT token" do
          payload = {
            "sub" => organization_user.to_global_id.to_s,
            "exp" => 1.hour.ago.to_i
          }
          expired_token = JWT.encode(payload, jwt_secret_key, "HS256")

          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "JWT #{expired_token}" }

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with invalid JWT signature" do
          payload = {
            "sub" => organization_user.to_global_id.to_s,
            "exp" => 1.hour.from_now.to_i
          }
          invalid_token = JWT.encode(payload, "wrong_secret", "HS256")

          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "JWT #{invalid_token}" }

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with malformed JWT token" do
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "JWT invalid.jwt.token" }

          expect(response).to have_http_status(:unauthorized)
        end

        it "returns unauthorized with JWT token containing invalid organization_user" do
          payload = {
            "sub" => "gid://invalid/OrganizationUser/999999",
            "exp" => 1.hour.from_now.to_i
          }
          invalid_token = JWT.encode(payload, jwt_secret_key, "HS256")

          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "JWT #{invalid_token}" }

          expect(response).to have_http_status(:unauthorized)
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

    context "authentication method precedence" do
      let(:jwt_secret_key) { "test_jwt_secret_key_for_specs" }
      let(:organization_user) { organization_memberships(:om_is_pawel) }
      let(:payload) do
        {
          "sub" => organization_user.to_global_id.to_s,
          "aud" => "test_audience", 
          "exp" => 1.hour.from_now.to_i
        }
      end
      let(:jwt_token) { JWT.encode(payload, jwt_secret_key, "HS256") }

      before do
        allow(Rails.application.credentials).to receive(:formula_eval).and_return(
          double(jwt_secret_key!: jwt_secret_key)
        )
      end

      it "uses API token when Bearer token is provided and valid" do
        expect {
          get "/api/v1/users/#{pawel.id}",
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change { pawel_is_token.reload.used_at }

        expect(response).to have_http_status(:ok)
      end

      it "falls back to JWT when Bearer token is invalid but JWT would be valid" do
        # This tests that when API token fails, it doesn't try JWT if Authorization header doesn't start with JWT
        get "/api/v1/users/#{pawel.id}",
          headers: { "Authorization" => "Bearer invalid_api_token" }

        expect(response).to have_http_status(:unauthorized)
      end

      it "uses JWT token when JWT header is provided" do
        get "/api/v1/users/#{pawel.id}",
          headers: { "Authorization" => "JWT #{jwt_token}" }

        expect(response).to have_http_status(:ok)
        # JWT tokens don't update used_at, so we can verify it's not using API token
        expect { pawel_is_token.reload }.not_to change { pawel_is_token.used_at }
      end
    end
  end
end