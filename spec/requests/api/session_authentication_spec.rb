require "rails_helper"

# API endpoints authenticate from the Authorization header only. A browser session must not
# authenticate a write, and token requests must not create one.
RSpec.describe "API authentication with a browser session", type: :request do
  fixtures :users, :organizations, :organization_memberships, :spaces, :documents,
    :oauth_applications, :oauth_access_tokens

  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:organization) { organizations(:is) }
  let(:json) { { "Content-Type" => "application/json", "Accept" => "application/json" } }
  let(:mcp_request) { { jsonrpc: "2.0", id: 1, method: "tools/list" }.to_json }

  let(:pawel_api_token) do
    ApiToken.create!(organization: organization, organization_membership: organization_memberships(:om_is_pawel),
      title: "Pawel's token")
  end

  # The test environment turns CSRF protection off, which would let every request through as
  # verified. Production has it on.
  around do |example|
    ActionController::Base.allow_forgery_protection = true
    example.run
  ensure
    ActionController::Base.allow_forgery_protection = false
  end

  # Devise's sign_in helper hands the user to Warden for the next request only. That request
  # commits the session cookie, so later requests authenticate from the cookie, like a browser.
  # Signing in itself happens with CSRF protection off, as everywhere else in the suite.
  def sign_in_with_browser_session(user)
    ActionController::Base.allow_forgery_protection = false
    sign_in user
    post select_organization_path(organization)
    expect(cookies["_fundamento_session"]).to be_present
  ensure
    ActionController::Base.allow_forgery_protection = true
  end

  def expect_token_challenge
    expect(response).to have_http_status(:unauthorized)
    expect(response.headers["WWW-Authenticate"]).to start_with("Bearer resource_metadata=")
  end

  describe "a session without a token" do
    before { sign_in_with_browser_session(pawel) }

    it "does not create a space" do
      expect {
        post "/api/v1/spaces", params: { space: { name: "From a session" } }.to_json, headers: json
      }.not_to change(Space, :count)

      expect_token_challenge
    end

    it "does not accept a form-encoded write" do
      expect {
        post "/api/v1/spaces", params: "space[name]=From+a+form",
          headers: { "Content-Type" => "application/x-www-form-urlencoded" }
      }.not_to change(Space, :count)

      expect_token_challenge
    end

    it "does not archive a space" do
      put "/api/v1/spaces/#{spaces(:is_default).id}/archive", headers: json

      expect_token_challenge
      expect(spaces(:is_default).reload).not_to be_archived
    end

    it "does not reach the MCP server" do
      post "/api/mcp", params: mcp_request, headers: json

      expect_token_challenge
    end
  end

  it "acts as the token's user when a session for someone else is present" do
    sign_in_with_browser_session(stefan)

    expect {
      post "/api/v1/spaces", params: { space: { name: "From a token" } }.to_json,
        headers: json.merge("Authorization" => "Bearer #{pawel_api_token.encrypted_token}")
    }.to change(Space, :count).by(1)

    expect(response).to have_http_status(:created)
  end

  it "does not start a session for an API token" do
    post "/api/v1/spaces", params: { space: { name: "From a token" } }.to_json,
      headers: json.merge("Authorization" => "Bearer #{pawel_api_token.encrypted_token}")

    expect(response).to have_http_status(:created)
    expect(response.headers["Set-Cookie"].to_s).not_to include("_fundamento_session")
  end

  describe "an OAuth token" do
    let(:oauth_headers) { json.merge("Authorization" => "Bearer is-access-token") }

    it "does not start a session" do
      post "/api/mcp", params: mcp_request, headers: oauth_headers

      expect(response).to have_http_status(:ok)
      expect(response.headers["Set-Cookie"].to_s).not_to include("_fundamento_session")
    end

    it "authenticates the request it is sent with, not the ones after it" do
      post "/api/mcp", params: mcp_request, headers: oauth_headers
      expect(response).to have_http_status(:ok)

      post "/api/mcp", params: mcp_request, headers: json

      expect_token_challenge
    end
  end

  it "keeps serving the legacy attachment URL to a browser session" do
    sign_in_with_browser_session(pawel)
    attachment = Attachment.create!(organization: organization, parent: documents(:one), filename: "test.txt",
      mime_type: "text/plain", data: "Hello World")

    get "/api/v1/attachments/#{attachment.id}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to eq("Hello World")
  end
end
