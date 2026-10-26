# frozen_string_literal: true
require "rails_helper"

# React draws users (mentions, the @ menu, people columns) from this JSON, so it
# needs what the UserAvatar view component uses: the picture and a display name.
RSpec.describe "Users JSON", type: :request do
  fixtures :organizations, :users, :organization_memberships

  let(:pawel) { users(:pawel) }
  let(:organization) { organizations(:is) }

  # 1x1 transparent PNG
  let(:png) { Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=") }

  before do
    sign_in pawel
    post select_organization_path(organization)
  end

  def attach_avatar(user)
    user.avatar.attach(io: StringIO.new(png), filename: "avatar.png", content_type: "image/png")
  end

  def find_user(json, user)
    json.find { |u| u["id"] == user.id }
  end

  describe "GET /users?mention=true" do
    it "sends the avatar url and display name for the @ menu" do
      attach_avatar(pawel)

      get users_path(format: :json, mention: true)

      result = find_user(JSON.parse(response.body), pawel)
      expect(result["display_name"]).to eq(pawel.display_name)
      expect(result["avatar_url"]).to include("avatar.png")
      expect(result).not_to have_key("email")
    end

    it "sends a nil avatar url for users without one" do
      get users_path(format: :json, mention: true)

      result = find_user(JSON.parse(response.body), pawel)
      expect(result).to include("avatar_url" => nil)
    end
  end

  describe "GET /users?user_ids[]=" do
    it "sends the avatar url for the users asked for" do
      attach_avatar(pawel)

      get users_path(format: :json, user_ids: [pawel.id])

      result = find_user(JSON.parse(response.body), pawel)
      expect(result["avatar_url"]).to include("avatar.png")
    end
  end

  describe "GET /users/:id" do
    it "sends the avatar url and display name" do
      attach_avatar(pawel)

      get user_path(pawel, format: :json)

      result = JSON.parse(response.body)
      expect(result["display_name"]).to eq(pawel.display_name)
      expect(result["avatar_url"]).to include("avatar.png")
    end
  end
end
