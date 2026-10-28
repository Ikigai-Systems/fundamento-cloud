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

  describe "granting access to the organization named by the MCP URL" do
    def authorize_for(resource)
      get oauth_authorization_path(authorize_params.merge(resource: resource))
    end

    it "skips the picker and issues a token for that organization" do
      sign_in pawel
      authorize_for("http://www.example.com/api/mcp/organizations/hc")
      expect(response).to have_http_status(:ok)

      post oauth_authorization_path, params: authorize_params

      expect(exchange_code_for_token.organization_membership_id).to eq("om_hc_pawel")
    end

    it "names the organization on the consent page" do
      sign_in pawel
      authorize_for("http://www.example.com/api/mcp/organizations/hc")

      expect(response.body).to include("connect to #{organizations(:hc).name} in Fundamento")
    end

    it "refuses an organization the user isn't in, rather than picking another" do
      sign_in users(:maria)

      expect { authorize_for("http://www.example.com/api/mcp/organizations/is") }
        .not_to change(Doorkeeper::AccessGrant, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "refuses an organization that doesn't exist the same way" do
      sign_in pawel
      authorize_for("http://www.example.com/api/mcp/organizations/does-not-exist")

      expect(response).to have_http_status(:forbidden)
    end

    it "still shows the picker for the shared MCP URL" do
      sign_in pawel
      authorize_for("http://www.example.com/api/mcp")

      expect(response).to redirect_to(%r{/oauth/pick-organization})
    end

    it "ignores an MCP URL on another host" do
      sign_in pawel
      authorize_for("https://elsewhere.example/api/mcp/organizations/hc")

      expect(response).to redirect_to(%r{/oauth/pick-organization})
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

      call_mcp(token.plaintext_token)

      expect(response).to have_http_status(:unauthorized)
    end
  end

  # A copy of the database must not hand out working credentials, so only a SHA-256 digest of
  # each token is stored. The fixtures hold plain values, like rows written before hashing.
  describe "storing tokens" do
    def digest(value) = Digest::SHA256.hexdigest(value)

    def refresh(refresh_token)
      post oauth_token_path, params: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
        client_id: application.uid,
        client_secret: "mcp-client-secret",
      }
    end

    it "stores only digests of the grant and the tokens it issues" do
      sign_in users(:maria)
      get oauth_authorization_path(authorize_params)
      post oauth_authorization_path, params: authorize_params
      code = Rack::Utils.parse_query(URI(response.location).query).fetch("code")

      expect(Doorkeeper::AccessGrant.order(:created_at).last.token).to eq(digest(code))

      token = exchange_code_for_token
      issued = response.parsed_body

      expect(token.token).to eq(digest(issued.fetch("access_token")))
      expect(token.refresh_token).to eq(digest(issued.fetch("refresh_token")))
    end

    it "refreshes a token it issued" do
      sign_in users(:maria)
      get oauth_authorization_path(authorize_params)
      post oauth_authorization_path, params: authorize_params
      exchange_code_for_token

      refresh(response.parsed_body.fetch("refresh_token"))

      expect(response).to have_http_status(:ok)
      call_mcp(response.parsed_body.fetch("access_token"))
      expect(response).to have_http_status(:ok)
    end

    it "accepts a token stored before hashing and replaces it with its digest" do
      call_mcp("is-access-token")

      expect(response).to have_http_status(:ok)
      expect(oauth_access_tokens(:is_pawel).reload.token).to eq(digest("is-access-token"))
    end

    it "refreshes a token stored before hashing" do
      refresh("is-refresh-token")

      expect(response).to have_http_status(:ok)
      call_mcp(response.parsed_body.fetch("access_token"))
      expect(response).to have_http_status(:ok)
    end
  end
end
