# frozen_string_literal: true
require "rails_helper"
require Rails.root.join("db/migrate/20261028140000_hash_plain_oauth_secrets")

# Runs on boot for self-hosted installs, whose assistants may hold credentials issued before
# hashing and never used since. They must keep working once the plain fallback is gone.
RSpec.describe HashPlainOauthSecrets do
  fixtures :users, :organizations, :organization_memberships, :oauth_applications,
    :oauth_access_grants, :oauth_access_tokens

  let(:application) { oauth_applications(:mcp) }
  let(:grant) { oauth_access_grants(:is_pawel) }
  let(:token) { oauth_access_tokens(:is_pawel) }

  around do |example|
    was_verbose = ActiveRecord::Migration.verbose
    ActiveRecord::Migration.verbose = false
    example.run
    ActiveRecord::Migration.verbose = was_verbose
  end

  def digest(value) = Digest::SHA256.hexdigest(value)

  # Rows as they were stored before hashing.
  before do
    application.update_columns(secret: "plain-secret")
    grant.update_columns(token: "plain-grant")
    token.update_columns(token: "plain-access", refresh_token: "plain-refresh", previous_refresh_token: "plain-previous")
  end

  it "replaces each plain secret with the digest Doorkeeper computes" do
    described_class.new.up

    expect(application.reload.secret).to eq(digest("plain-secret"))
    expect(grant.reload.token).to eq(digest("plain-grant"))
    expect(token.reload).to have_attributes(
      token: digest("plain-access"),
      refresh_token: digest("plain-refresh"),
      previous_refresh_token: digest("plain-previous"),
    )
  end

  it "keeps the credentials usable without the plain fallback" do
    described_class.new.up

    expect(Doorkeeper::AccessToken.by_token("plain-access")).to eq(token)
    expect(Doorkeeper::AccessToken.by_refresh_token("plain-refresh")).to eq(token)
    expect(Doorkeeper::Application.by_uid_and_secret(application.uid, "plain-secret")).to eq(application)
  end

  it "hashes values with characters Postgres could read as escapes the same way Ruby does" do
    token.update_columns(token: "a\\x41b-zażółć")

    described_class.new.up

    expect(token.reload.token).to eq(digest("a\\x41b-zażółć"))
  end

  it "leaves digests and an empty previous refresh token alone, so it can run twice" do
    token.update_columns(previous_refresh_token: "")
    described_class.new.up
    hashed = token.reload.attributes

    described_class.new.up

    expect(token.reload.attributes).to eq(hashed)
    expect(token.previous_refresh_token).to eq("")
  end
end
