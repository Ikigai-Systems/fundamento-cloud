require "rails_helper"

RSpec.describe "Api::V1::Spaces", type: :request do
  fixtures :organizations, :users, :organization_users, :spaces

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_users(:ou_is_pawel) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_user: pawel_ikigai_systems,
      title: "Test API Token for Pawel at IS"
    )
  end

  describe "GET /api/v1/spaces" do
    context "with valid API token" do
      it "returns list of spaces" do
        get api_v1_spaces_path,
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to be_an(Array)
        expect(json_response.length).to be >= 1

        first_space = json_response.first
        expect(first_space).to have_key("npi")
        expect(first_space).to have_key("name")
        expect(first_space).to have_key("created_at")
        expect(first_space).to have_key("updated_at")
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        get api_v1_spaces_path,
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/spaces/:npi" do
    context "with valid API token" do
      it "returns space details with documents" do
        get api_v1_space_path(is_default_space.npi),
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response["npi"]).to eq(is_default_space.npi)
        expect(json_response["name"]).to eq(is_default_space.name)
        expect(json_response).to have_key("documents")
        expect(json_response).to have_key("created_at")
        expect(json_response).to have_key("updated_at")
      end
    end

    context "with invalid space npi" do
      it "returns not found" do
        get api_v1_space_path("invalid-npi"),
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/spaces" do
    context "with valid API token and manager permissions" do
      before do
        # Ensure pawel is a manager
        pawel_ikigai_systems.update!(role: :manager)
      end

      it "creates a space with name only (defaults to public)" do
        expect {
          post api_v1_spaces_path,
            params: {
              space: {
                name: "New Test Space"
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Space, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["npi"]).to be_present
        expect(json_response["name"]).to eq("New Test Space")
        expect(json_response["access_mode"]).to eq("public")
        expect(json_response["created_at"]).to be_present
        expect(json_response["updated_at"]).to be_present

        # Verify home document was created
        created_space = Space.find_by(npi: json_response["npi"])
        expect(created_space.home_document).to be_present
      end

      it "creates a space with explicit access mode" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: "Private Space",
              access_mode: "private"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["name"]).to eq("Private Space")
        expect(json_response["access_mode"]).to eq("private")
      end

      it "creates a restricted space" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: "Restricted Space",
              access_mode: "restricted"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["access_mode"]).to eq("restricted")
      end

      it "returns error when name is missing" do
        post api_v1_spaces_path,
          params: {
            space: {
              access_mode: "public"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]).to be_present
      end

      it "returns error when name is duplicate within organization" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: is_default_space.name
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]).to include(match(/has already been taken/i))
      end
    end

    context "without manager permissions" do
      before do
        # Ensure pawel is not a manager
        pawel_ikigai_systems.update!(role: :member)
      end

      it "returns forbidden" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: "Unauthorized Space"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: "Test Space"
            }
          },
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        post api_v1_spaces_path,
          params: {
            space: {
              name: "Test Space"
            }
          }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
