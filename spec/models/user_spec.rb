require "rails_helper"

RSpec.describe User, type: :model do
  fixtures :users, :organizations, :organization_users

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      user = users(:pawel)
      expect(user.id).to be_a(String)
      expect(user.id).to eq("user_pawel")
    end

    it "has string user_id in organization_users" do
      organization_user = organization_users(:ou_is_pawel)
      expect(organization_user.user_id).to be_a(String)
      expect(organization_user.user_id).to eq("user_pawel")
    end

    it "can create new user with string ID" do
      user = User.create!(
        id: "testuser1",
        first_name: "Test",
        last_name: "User",
        email: "testuser1@example.com",
        password: "password123",
        confirmed_at: Time.now
      )
      expect(user.id).to eq("testuser1")
      expect(user.persisted?).to be true
    end

    it "orders by created_at due to NpiOrdering concern" do
      expect(User.implicit_order_column).to eq(:created_at)
    end

    it "maintains organization_user associations" do
      user = users(:pawel)
      expect(user.organizations_users.count).to be > 0
      expect(user.organizations_users.first).to be_a(OrganizationUser)
    end
  end
end
