require "rails_helper"

# A form posted with a token the server no longer accepts. iOS Safari restores tabs from its
# page cache after the session has rotated, so their forms carry a stale token; production saw
# one phone tap "Switch to" thirteen times in a minute, each answered with a bare 422 that Turbo
# renders as nothing at all.
#
# The test environment switches forgery protection off, which is why no spec saw this before.
RSpec.describe "Forms posted with an expired token", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:pawel) { users(:pawel) }
  let(:is_org) { organizations(:is) }

  around do |example|
    ActionController::Base.allow_forgery_protection = true
    example.run
  ensure
    ActionController::Base.allow_forgery_protection = false
  end

  before { sign_in pawel }

  it "sends the user back to the page with a message, so a retry works" do
    post select_organization_path(is_org),
      params: { authenticity_token: "stale-token" },
      headers: { "Referer" => organizations_url }

    expect(response).to redirect_to(organizations_url)
    expect(response).to have_http_status(:see_other)
    expect(flash[:alert]).to match(/expired.*try again/i)
  end

  it "changes nothing" do
    post select_organization_path(is_org),
      params: { authenticity_token: "stale-token" },
      headers: { "Referer" => organizations_url }

    expect(cookies[:organization_id]).to be_blank
  end

  it "falls back to the home page when there is no page to go back to" do
    post select_organization_path(is_org), params: { authenticity_token: "stale-token" }

    expect(response).to redirect_to(root_url)
  end

  it "still rejects a JSON request outright" do
    post select_organization_path(is_org),
      params: { authenticity_token: "stale-token" },
      as: :json

    expect(response).to have_http_status(:unprocessable_content)
  end
end
