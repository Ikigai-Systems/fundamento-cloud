require "rails_helper"

RSpec.describe Users::OmniauthCallbacksController, type: :request do
  fixtures :users

  let(:google_uid) { "google-uid-123" }
  let(:google_email) { "newuser@example.com" }

  let(:auth_hash) do
    OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: google_uid,
      info: OmniAuth::AuthHash::InfoHash.new(
        email: google_email,
        first_name: "New",
        last_name: "User",
        name: "New User"
      ),
      credentials: OmniAuth::AuthHash.new(
        token: "access-token",
        refresh_token: "refresh-token",
        expires_at: 1.hour.from_now.to_i
      )
    )
  end

  before do
    Rails.application.env_config["omniauth.auth"] = auth_hash
  end

  after do
    Rails.application.env_config.delete("omniauth.auth")
  end

  def trigger_oauth
    get user_google_oauth2_omniauth_callback_path
  end

  describe "Google OAuth callback" do
    context "when a matching UserIdentity exists (uid match)" do
      let(:existing_user) { users(:pawel) }

      before do
        UserIdentity.create!(
          user: existing_user,
          provider: "google_oauth2",
          uid: google_uid,
          email: existing_user.email,
          name: existing_user.display_name
        )
      end

      it "signs in the existing user without creating a new one" do
        expect { trigger_oauth }.not_to change(User, :count)
        expect(response).to redirect_to(root_path)
      end

      it "does not create a new identity" do
        expect { trigger_oauth }.not_to change(UserIdentity, :count)
      end
    end

    context "when a user exists with the same email but no identity (silent link)" do
      let(:existing_user) { users(:pawel) }

      before do
        Rails.application.env_config["omniauth.auth"] = auth_hash.merge(
          info: auth_hash.info.merge(email: existing_user.email)
        )
      end

      it "does not create a new user" do
        expect { trigger_oauth }.not_to change(User, :count)
      end

      it "creates a UserIdentity linked to the existing user" do
        expect { trigger_oauth }.to change(UserIdentity, :count).by(1)

        identity = UserIdentity.find_by(provider: "google_oauth2", uid: google_uid)
        expect(identity.user).to eq(existing_user)
      end

      it "signs in the existing user" do
        trigger_oauth
        expect(response).to redirect_to(root_path)
      end
    end

    context "when no user exists with this email (new sign-up)" do
      it "creates a new user" do
        expect { trigger_oauth }.to change(User, :count).by(1)
      end

      it "creates a UserIdentity for the new user" do
        expect { trigger_oauth }.to change(UserIdentity, :count).by(1)
      end

      it "sets confirmed_at on the new user" do
        trigger_oauth
        expect(User.find_by(email: google_email).confirmed_at).to be_present
      end

      it "populates first and last name from Google" do
        trigger_oauth
        user = User.find_by(email: google_email)
        expect(user.first_name).to eq("New")
        expect(user.last_name).to eq("User")
      end

      it "redirects to root after sign-in" do
        trigger_oauth
        expect(response).to redirect_to(root_path)
      end
    end

    context "when an existing user with a name signs in via Google" do
      let(:existing_user) { users(:pawel) }
      let(:original_first_name) { existing_user.first_name }

      before do
        Rails.application.env_config["omniauth.auth"] = auth_hash.merge(
          info: auth_hash.info.merge(
            email: existing_user.email,
            first_name: "Different",
            last_name: "Name"
          )
        )
      end

      it "does not overwrite the existing user name" do
        trigger_oauth
        expect(existing_user.reload.first_name).to eq(original_first_name)
      end
    end
  end
end
