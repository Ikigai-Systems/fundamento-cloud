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

  describe "JSON-RPC exchanges" do
    def rpc(body, headers = {})
      headers = {
        "Content-Type" => "application/json",
        "Accept" => "application/json, text/event-stream",
        "Authorization" => "Bearer #{oauth_token}",
      }.merge(headers)
      post "/api/mcp/organizations/is", params: body.to_json, headers: headers
    end

    it "does not promise list-changed notifications it can't deliver" do
      rpc({
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "spec", version: "1" } },
      })

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("result", "capabilities", "tools")).to eq({})
    end

    it "acknowledges a notification with 202 Accepted" do
      rpc({ jsonrpc: "2.0", method: "notifications/initialized" })

      expect(response).to have_http_status(:accepted)
      expect(response.body).to be_empty
    end

    it "mirrors structured tool results into text content" do
      rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "list_tables_tool", arguments: {} } })

      result = response.parsed_body["result"]
      expect(result["structuredContent"]).to be_present
      expect(result["content"]).to eq([{ "type" => "text", "text" => result["structuredContent"].to_json }])
    end

    it "mirrors tool errors into text content" do
      rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "read_document_tool", arguments: { id: "missing" } } })

      result = response.parsed_body["result"]
      expect(result["isError"]).to be(true)
      expect(JSON.parse(result.dig("content", 0, "text"))).to include("error" => "not_found")
    end

    it "serves a request of the 2026-07-28 stateless lifecycle" do
      meta = {
        "io.modelcontextprotocol/protocolVersion" => "2026-07-28",
        "io.modelcontextprotocol/clientInfo" => { name: "spec", version: "1" },
        "io.modelcontextprotocol/clientCapabilities" => {},
      }

      rpc(
        { jsonrpc: "2.0", id: 4, method: "tools/list", params: { _meta: meta } },
        { "MCP-Protocol-Version" => "2026-07-28", "Mcp-Method" => "tools/list" },
      )

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("result", "resultType")).to eq("complete")
      expect(response.parsed_body.dig("result", "tools")).to be_present
    end
  end
end
