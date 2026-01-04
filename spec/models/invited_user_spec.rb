require "rails_helper"

RSpec.describe InvitedUser, type: :model do
  fixtures :organizations

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      organization = organizations(:is)
      invited_user = InvitedUser.create!(
        id: "inviteduser1",
        first_name: "Invited",
        last_name: "User",
        email: "invited@example.com",
        organization: organization
      )
      expect(invited_user.id).to be_a(String)
      expect(invited_user.id).to eq("inviteduser1")
    end

    it "orders by created_at due to NpiOrdering concern" do
      expect(InvitedUser.implicit_order_column).to eq(:created_at)
    end

    it "can create multiple invited users with string IDs" do
      organization = organizations(:is)

      user1 = InvitedUser.create!(
        id: "inviteduser2",
        first_name: "First",
        last_name: "Invited",
        email: "first.invited@example.com",
        organization: organization
      )

      user2 = InvitedUser.create!(
        id: "inviteduser3",
        first_name: "Second",
        last_name: "Invited",
        email: "second.invited@example.com",
        organization: organization
      )

      expect(user1.id).to eq("inviteduser2")
      expect(user2.id).to eq("inviteduser3")
      expect(user1.persisted?).to be true
      expect(user2.persisted?).to be true
    end

    it "maintains organization association" do
      organization = organizations(:hc)
      invited_user = InvitedUser.create!(
        id: "inviteduser4",
        first_name: "Org",
        last_name: "Test",
        email: "org.test@example.com",
        organization: organization
      )
      expect(invited_user.organization).to eq(organization)
    end
  end
end
