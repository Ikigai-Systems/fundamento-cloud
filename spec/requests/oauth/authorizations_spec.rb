require "rails_helper"

RSpec.describe "OAuth authorization", type: :request do
  fixtures :users, :organizations, :organization_memberships, :oauth_applications, :oauth_access_tokens

  let(:pawel) { users(:pawel) }
  let(:application) { oauth_applications(:mcp) }
  let(:code_verifier) { SecureRandom.urlsafe_base64(48) }
  let(:authorize_params) do
    {
      client_id: application.uid,
      redirect_uri: application.redirect_uri,
      response_type: "code",
      scope: "mcp",
      state: "state-123",
      code_challenge: Base64.urlsafe_encode64(Digest::SHA256.digest(code_verifier), padding: false),
      code_challenge_method: "S256",
    }
  end

  def pick_organization(membership)
    get oauth_authorization_path(authorize_params)
    expect(response).to redirect_to(%r{/oauth/pick-organization})
    picker = Rack::Utils.parse_query(URI(response.location).query)
    post oauth_pick_organization_path,
      params: { organization_membership_id: membership.id, return_to: picker["return_to"], oauth_state: picker["oauth_state"] }
  end

  def exchange_code_for_token
    code = Rack::Utils.parse_query(URI(response.location).query).fetch("code")
    post oauth_token_path, params: {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: application.redirect_uri,
      client_id: application.uid,
      client_secret: "mcp-client-secret",
      code_verifier: code_verifier,
    }
    expect(response).to have_http_status(:ok)
    Doorkeeper::AccessToken.by_token(response.parsed_body.fetch("access_token"))
  end

  def call_mcp(token)
    post "/api/mcp",
      params: { jsonrpc: "2.0", id: 1, method: "tools/list" }.to_json,
      headers: { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end

  describe "granting access" do
    before { sign_in pawel }

    it "issues a token for the organization the user picked" do
      pick_organization(organization_memberships(:om_hc_pawel))
      post oauth_authorization_path, params: authorize_params

      expect(exchange_code_for_token.organization_membership_id).to eq("om_hc_pawel")
    end

    it "ignores a membership submitted with the approval" do
      pick_organization(organization_memberships(:om_is_pawel))
      post oauth_authorization_path, params: authorize_params.merge(organization_membership_id: "om_is_stefan")

      expect(exchange_code_for_token.organization_membership_id).to eq("om_is_pawel")
    end

    it "uses the only membership of a user in one organization, without the picker" do
      sign_in users(:maria)
      get oauth_authorization_path(authorize_params)
      expect(response).to have_http_status(:ok)

      post oauth_authorization_path, params: authorize_params

      expect(exchange_code_for_token.organization_membership_id).to eq("om_hc_maria")
    end
  end

  describe "using a token" do
    it "accepts a token whose membership belongs to its owner" do
      call_mcp(oauth_access_tokens(:is_pawel).token)

      expect(response).to have_http_status(:ok)
    end

    it "rejects a token whose membership belongs to someone else" do
      token = Doorkeeper::AccessToken.create!(
        application_id: application.id,
        resource_owner_id: pawel.id,
        organization_membership_id: "om_is_stefan",
        scopes: "mcp",
        expires_in: 7200,
      )

      call_mcp(token.token)

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
