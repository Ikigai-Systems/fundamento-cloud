require "rails_helper"

RSpec.describe "Version", type: :request do
  it "reports the running version without authentication" do
    get app_version_path

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("version" => Fundamento::VERSION)
  end

  it "reports the contents of version.txt" do
    expect(Fundamento::VERSION).to eq(Rails.root.join("version.txt").read.strip)
  end
end
