require "rails_helper"

RSpec.describe "OAuth protected resource metadata", type: :request do
  it "describes the shared MCP endpoint" do
    get "/.well-known/oauth-protected-resource"

    expect(response.parsed_body).to include(
      "resource" => "http://www.example.com/api/mcp",
      "authorization_servers" => ["http://www.example.com"],
    )
  end

  it "describes an organization's MCP endpoint at its path-suffixed URL" do
    get "/.well-known/oauth-protected-resource/api/mcp/organizations/hc"

    expect(response.parsed_body).to include(
      "resource" => "http://www.example.com/api/mcp/organizations/hc",
      "authorization_servers" => ["http://www.example.com"],
    )
  end
end
