require "rails_helper"

RSpec.describe PublicLink, type: :model do
  let(:organization) { Organization.create!(name: "Test Org") }
  let(:space) { Space.create!(organization: organization, name: "Test Space") }
  let(:document) { Document.create!(organization: organization, space: space) }
  let(:user) { User.create!(email: "test@example.com", password: "password", first_name: "Test", last_name: "User", confirmed_at: Time.now) }

  describe "allowed_emails field" do
    context "when allowed_emails is nil" do
      it "returns empty array" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: nil
        )

        expect(public_link.allowed_emails).to eq([])
      end
    end

    context "when allowed_emails is empty array" do
      it "returns empty array" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: []
        )

        expect(public_link.allowed_emails).to eq([])
      end
    end

    context "when allowed_emails contains valid emails" do
      it "normalizes emails to lowercase and trims whitespace" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: [" USER@EXAMPLE.COM ", "test@example.org"]
        )

        expect(public_link.allowed_emails).to eq(["user@example.com", "test@example.org"])
      end

      it "removes blank entries" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["user@example.com", "", "  ", nil, "test@example.org"]
        )

        expect(public_link.allowed_emails).to eq(["user@example.com", "test@example.org"])
      end
    end

    context "email validation" do
      it "allows valid email addresses" do
        public_link = PublicLink.new(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["user@example.com", "test.email+tag@example.org"]
        )

        expect(public_link).to be_valid
      end

      it "rejects invalid email addresses" do
        public_link = PublicLink.new(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["valid@example.com", "invalid-email", "notanemail"]
        )

        expect(public_link).not_to be_valid
        expect(public_link.errors[:allowed_emails].first).to match(/contains invalid email addresses:/)
        expect(public_link.errors[:allowed_emails].first).to include("invalid-email")
        expect(public_link.errors[:allowed_emails].first).to include("notanemail")
      end

      it "provides helpful error messages for invalid emails" do
        public_link = PublicLink.new(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["bad-email", "not@valid@email.com"]
        )

        expect(public_link).not_to be_valid
        expect(public_link.errors[:allowed_emails].first).to match(/contains invalid email addresses:/)
        expect(public_link.errors[:allowed_emails].first).to include("bad-email")
        expect(public_link.errors[:allowed_emails].first).to include("not@valid@email.com")
      end

      it "allows empty or nil allowed_emails" do
        public_link_nil = PublicLink.new(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: nil
        )

        public_link_empty = PublicLink.new(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: []
        )

        expect(public_link_nil).to be_valid
        expect(public_link_empty).to be_valid
      end
    end

    context "normalization behavior" do
      it "preserves email format consistency for comparisons with User model" do
        # Create a user with lowercase email
        user_email = "Test.User+Tag@Example.COM"
        test_user = User.create!(
          email: user_email,
          password: "password",
          first_name: "Test",
          last_name: "User",
          confirmed_at: Time.now,
        )

        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: [" #{user_email.upcase} "]
        )

        # Both should be normalized to the same format for comparison
        normalized_user_email = test_user.email.downcase
        normalized_allowed_email = public_link.allowed_emails.first

        expect(normalized_allowed_email).to eq(normalized_user_email)
      end

      it "handles mixed case and whitespace consistently" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: [
            "  UPPER@EXAMPLE.COM  ",
            "mixed.Case@Example.ORG",
            " lower@example.net "
          ]
        )

        expect(public_link.allowed_emails).to eq([
          "upper@example.com",
          "mixed.case@example.org",
          "lower@example.net"
        ])
      end
    end

    context "edge cases" do
      it "handles array with only blank values" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["", "  ", nil]
        )

        expect(public_link.allowed_emails).to eq([])
      end

      it "deduplicates normalized emails" do
        public_link = PublicLink.create!(
          organization: organization,
          object: document,
          updated_by: user,
          allowed_emails: ["test@example.com", " TEST@EXAMPLE.COM ", "test@example.com"]
        )

        # Should remove duplicates after normalization
        expect(public_link.allowed_emails).to eq(["test@example.com"])
        expect(public_link.allowed_emails.length).to eq(1)
      end
    end
  end
end