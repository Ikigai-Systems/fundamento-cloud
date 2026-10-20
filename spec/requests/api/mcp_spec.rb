require "rails_helper"

RSpec.describe "MCP endpoint", type: :request do
  fixtures :users, :organizations, :organization_memberships, :oauth_applications, :oauth_access_tokens

  def call_mcp(path, token = nil)
    headers = { "Content-Type" => "application/json" }
    headers["Authorization"] = "Bearer #{token}" if token
    post path, params: { jsonrpc: "2.0", id: 1, method: "tools/list" }.to_json, headers: headers
  end

  let(:oauth_token) { oauth_access_tokens(:is_pawel).token }

  describe "/api/mcp" do
    it "serves any organization the token belongs to" do
      call_mcp("/api/mcp", oauth_token)

      expect(response).to have_http_status(:ok)
    end

    it "points an unauthenticated client at the shared metadata" do
      call_mcp("/api/mcp")

      expect(response).to have_http_status(:unauthorized)
      expect(response.headers["WWW-Authenticate"])
        .to eq(%(Bearer resource_metadata="http://www.example.com/.well-known/oauth-protected-resource"))
    end
  end

  describe "/api/mcp/organizations/:organization_id" do
    it "serves an OAuth token for that organization" do
      call_mcp("/api/mcp/organizations/is", oauth_token)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("result", "tools")).to be_present
    end

    it "rejects an OAuth token for another organization so the client re-authorizes" do
      call_mcp("/api/mcp/organizations/hc", oauth_token)

      expect(response).to have_http_status(:unauthorized)
      expect(response.headers["WWW-Authenticate"]).to eq(
        %(Bearer error="invalid_token", resource_metadata="http://www.example.com/.well-known/oauth-protected-resource/api/mcp/organizations/hc"),
      )
    end

    it "serves an API token for that organization and rejects one for another" do
      api_token = ApiToken.create!(
        organization: organizations(:hc),
        organization_membership: organization_memberships(:om_hc_pawel),
        title: "HeroCoders MCP",
      ).encrypted_token

      call_mcp("/api/mcp/organizations/hc", api_token)
      expect(response).to have_http_status(:ok)

      call_mcp("/api/mcp/organizations/is", api_token)
      expect(response).to have_http_status(:unauthorized)
    end

    it "answers an unknown organization like any other mismatch" do
      call_mcp("/api/mcp/organizations/does-not-exist", oauth_token)

      expect(response).to have_http_status(:unauthorized)
    end

    it "points an unauthenticated client at the organization's metadata" do
      call_mcp("/api/mcp/organizations/hc")

      expect(response).to have_http_status(:unauthorized)
      expect(response.headers["WWW-Authenticate"]).to eq(
        %(Bearer resource_metadata="http://www.example.com/.well-known/oauth-protected-resource/api/mcp/organizations/hc"),
      )
    end
  end
end
