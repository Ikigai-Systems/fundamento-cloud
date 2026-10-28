require "rails_helper"

RSpec.describe "API tokens page", type: :request do
  fixtures :users, :organizations, :organization_memberships

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  before do
    sign_in user
    post select_organization_path(organization)
  end

  it "explains what a token is for and points assistants to AI Assistants" do
    get api_tokens_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Bearer", "funcli", ai_assistants_path)
  end

  it "redirects the old per-user path" do
    get "/users/#{user.id}/api_tokens"

    expect(response).to redirect_to("/integrations/api-tokens")
  end

  describe "creating a token" do
    def create_token(params)
      post api_tokens_path,
        params: { api_token: params },
        headers: { "Turbo-Frame" => "modal", "Accept" => "text/vnd.turbo-stream.html" }
    end

    it "generates the token on the server and shows it once" do
      create_token(title: "CLI")

      token = ApiToken.order(:created_at).last
      expect(token.title).to eq("CLI")
      expect(token.encrypted_token).to match(/\A\h{64}\z/)
      expect(response.body).to include(token.encrypted_token)
    end

    # The token used to travel through a hidden form field, so a user could pick their own.
    it "ignores a token sent with the request" do
      create_token(title: "CLI", encrypted_token: "chosen")

      expect(ApiToken.order(:created_at).last.encrypted_token).not_to eq("chosen")
    end
  end
end
