require "rails_helper"

RSpec.describe UserIdentity, type: :model do
  fixtures :users

  let(:user) { users(:pawel) }

  describe "validations" do
    it "is valid with valid attributes" do
      identity = UserIdentity.new(user: user, provider: "google_oauth2", uid: "uid-123")
      expect(identity).to be_valid
    end

    it "requires provider" do
      identity = UserIdentity.new(user: user, uid: "uid-123")
      expect(identity).not_to be_valid
      expect(identity.errors[:provider]).to be_present
    end

    it "requires uid" do
      identity = UserIdentity.new(user: user, provider: "google_oauth2")
      expect(identity).not_to be_valid
      expect(identity.errors[:uid]).to be_present
    end

    it "enforces uniqueness of uid scoped to provider" do
      UserIdentity.create!(user: user, provider: "google_oauth2", uid: "uid-123")
      duplicate = UserIdentity.new(user: user, provider: "google_oauth2", uid: "uid-123")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:uid]).to be_present
    end

    it "allows same uid for different providers" do
      UserIdentity.create!(user: user, provider: "google_oauth2", uid: "uid-123")
      other = UserIdentity.new(user: user, provider: "apple", uid: "uid-123")
      expect(other).to be_valid
    end
  end

  describe "id generation" do
    it "generates a nanoid on create" do
      identity = UserIdentity.create!(user: user, provider: "google_oauth2", uid: "uid-456")
      expect(identity.id).to be_present
      expect(identity.id.length).to eq(10)
    end
  end
end
