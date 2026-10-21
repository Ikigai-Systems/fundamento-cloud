require "rails_helper"

RSpec.describe "AI Assistants", type: :request do
  fixtures :users, :organizations, :organization_memberships, :spaces

  before do
    sign_in users(:pawel)
    post select_organization_path(organizations(:hc))
  end

  it "gives the MCP URL of the current organization" do
    get ai_assistants_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("http://www.example.com/api/mcp/organizations/hc")
    expect(response.body).not_to include("/api/mcp/organizations/is")
  end
end
