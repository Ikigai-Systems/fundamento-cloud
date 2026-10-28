require "rails_helper"

RSpec.describe "OAuth client registration", type: :request do
  def register
    post "/oauth/register",
      params: { client_name: "Test client", redirect_uris: ["https://example.test/callback"] }.to_json,
      headers: { "Content-Type" => "application/json" }
  end

  it "returns the client secret once and stores only its digest" do
    register

    expect(response).to have_http_status(:created)
    body = response.parsed_body
    application = Doorkeeper::Application.find_by!(uid: body.fetch("client_id"))

    expect(application.secret).to eq(Digest::SHA256.hexdigest(body.fetch("client_secret")))
    expect(Doorkeeper::Application.by_uid_and_secret(body["client_id"], body["client_secret"])).to eq(application)
  end

  it "requires a redirect URI" do
    post "/oauth/register",
      params: { client_name: "Test client" }.to_json,
      headers: { "Content-Type" => "application/json" }

    expect(response).to have_http_status(:bad_request)
  end
end
