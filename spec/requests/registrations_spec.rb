require "rails_helper"

RSpec.describe "User Registration", type: :request do
  describe "POST /users" do
    it "saves reddit_click_id from the form" do
      post user_registration_path, params: {
        user: {
          email: "newuser@example.com",
          password: "password123",
          password_confirmation: "password123",
          reddit_click_id: "rdt_abc123"
        }
      }

      user = User.find_by(email: "newuser@example.com")
      expect(user.reddit_click_id).to eq("rdt_abc123")
    end

    it "works without reddit_click_id" do
      post user_registration_path, params: {
        user: {
          email: "newuser2@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }

      user = User.find_by(email: "newuser2@example.com")
      expect(user).to be_present
      expect(user.reddit_click_id).to be_nil
    end

    describe "Reddit CAPI SIGN_UP event" do
      it "enqueues RedditConversionJob after successful registration" do
        allow(RedditConversionService).to receive(:enabled?).and_return(true)

        expect {
          post user_registration_path, params: {
            user: {
              email: "reddit-test@example.com",
              password: "password123",
              password_confirmation: "password123",
              reddit_click_id: "rdt_abc123"
            }
          }
        }.to have_enqueued_job(RedditConversionJob).with(
          event_type: "SignUp",
          user_id: anything,
          ip_address: anything,
          user_agent: anything
        )
      end

      it "does not enqueue when RedditConversionService is disabled" do
        allow(RedditConversionService).to receive(:enabled?).and_return(false)

        expect {
          post user_registration_path, params: {
            user: {
              email: "reddit-test2@example.com",
              password: "password123",
              password_confirmation: "password123"
            }
          }
        }.not_to have_enqueued_job(RedditConversionJob)
      end
    end
  end
end
