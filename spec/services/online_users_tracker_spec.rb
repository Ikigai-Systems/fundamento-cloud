require "rails_helper"

RSpec.describe OnlineUsersTracker do
  let(:organization) { instance_double(Organization, cache_key: "organizations/abc123") }

  around do |example|
    original = Rails.configuration.x.redis_key_prefix
    example.run
  ensure
    Rails.configuration.x.redis_key_prefix = original
  end

  it "keeps its Redis keys unchanged when no key prefix is set" do
    Rails.configuration.x.redis_key_prefix = ""

    expect(described_class.redis_key(organization)).to eq("online_users/#{organization.cache_key}")
  end

  it "puts the key prefix in front of its raw Redis keys, which the cache namespace doesn't cover" do
    Rails.configuration.x.redis_key_prefix = "wt_feature:"

    expect(described_class.redis_key(organization)).to eq("wt_feature:online_users/#{organization.cache_key}")
    expect(described_class.redis_key).to eq("wt_feature:online_users/")
  end
end
