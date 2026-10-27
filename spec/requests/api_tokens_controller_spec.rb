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
end
