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
    get user_api_tokens_path(user)

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Bearer", "funcli", ai_assistants_path)
  end
end
