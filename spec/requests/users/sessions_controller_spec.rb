require 'rails_helper'

RSpec.describe Users::SessionsController, type: :request do
  let(:user) { users(:pawel) }

  fixtures :users

  describe "POST /users/sign_in" do
    context "with valid credentials" do
      it "logs the user in" do
        post user_session_path, params: {
          user: {
            email: user.email,
            password: "password",
            authentication_method: "password"
          }
        }

        expect(response).to redirect_to(root_path)
        expect(controller.current_user).to eq(user)
      end
    end

    context "with invalid credentials" do
      it "does not log the user in" do
        post user_session_path, params: {
          user: {
            email: user.email,
            password: 'wrong password',
            authentication_method: "password"
          }
        }

        expect(response).to render_template(:new)
        expect(response.body).to include('name="user[password]"')
        expect(controller.current_user).to be_nil
      end
    end

    context "with remember_me checked" do
      it "sets the remember_user_token cookie" do
        post user_session_path, params: {
          user: {
            email: user.email,
            password: "password",
            authentication_method: "password",
            remember_me: "1"
          }
        }

        expect(response).to redirect_to(root_path)
        expect(response.cookies["remember_user_token"]).to be_present
      end

      it "remembers the user for 30 days" do
        freeze_time do
          sign_in_with_password(remember_me: "1")

          expect(response_cookie_expiry("remember_user_token")).to be_within(1.minute).of(30.days.from_now)
        end
      end
    end

    # iOS Safari drops the session cookie often, so the remember cookie is what keeps a phone
    # signed in. Each time it restores a session its 30 days start again.
    context "when the session cookie is gone and the remember cookie restores the session" do
      let(:session_key) { Rails.application.config.session_options[:key] }

      it "keeps a user who comes back within 30 days signed in, for another 30 days" do
        sign_in_with_password(remember_me: "1")

        travel 20.days do
          cookies.delete(session_key)
          get root_path

          expect(controller.current_user).to eq(user)
          expect(response_cookie_expiry("remember_user_token")).to be_within(1.minute).of(30.days.from_now)
        end
      end

      it "signs out a user who stays away for more than 30 days" do
        sign_in_with_password(remember_me: "1")

        travel 31.days do
          cookies.delete(session_key)
          get root_path

          expect(response).to redirect_to(new_user_session_path)
        end
      end
    end

    context "without remember_me" do
      it "does not set the remember_user_token cookie" do
        post user_session_path, params: {
          user: {
            email: user.email,
            password: "password",
            authentication_method: "password"
          }
        }

        expect(response).to redirect_to(root_path)
        expect(response.cookies["remember_user_token"]).to be_nil
      end
    end
  end

  describe "GET /users/sign_in" do
    when_feature_both_states(:standalone) do
      it "displays the remember_me checkbox" do
        get new_user_session_path

        expect(response.body).to include('name="user[remember_me]"')
        expect(response.body).to include("Remember me")
      end
    end
  end

  describe "remember_me persistence in cloud mode" do
    before { Flipper.disable(:standalone) }

    context "when remember_me is checked on email step" do
      it "pre-checks remember_me on password step" do
        # Step 1: Submit email with remember_me checked
        post user_session_path, params: {
          user: {
            email: user.email,
            remember_me: "1"
          }
        }

        # Should render the password form with remember_me checked
        expect(response.body).to include('name="user[remember_me]"')
        expect(response.body).to include('checked="checked"')
      end
    end

    context "when remember_me is not checked on email step" do
      it "does not check remember_me on password step" do
        # Step 1: Submit email without remember_me
        post user_session_path, params: {
          user: {
            email: user.email
          }
        }

        # Should render the password form with remember_me unchecked
        expect(response.body).to include('name="user[remember_me]"')
        expect(response.body).not_to include('checked="checked"')
      end
    end
  end

  # Each device is its own integration session, with its own cookie jar
  describe "signing out" do
    let(:session_key) { Rails.application.config.session_options[:key] }
    let(:phone) { sign_in_on_new_device }
    let(:laptop) { sign_in_on_new_device }

    def signed_in?(device)
      device.get edit_user_registration_path
      device.response.ok?
    end

    def lose_session_cookie(device)
      device.cookies.delete(session_key)
    end

    describe "DELETE /users/sign_out" do
      it "keeps other devices signed in, including through their remember cookie" do
        phone
        laptop.delete destroy_user_session_path

        expect(signed_in?(laptop)).to be false
        lose_session_cookie(phone)
        expect(signed_in?(phone)).to be true
      end
    end

    describe "DELETE /users/sign_out_everywhere" do
      it "signs out this device" do
        laptop.delete sign_out_everywhere_path

        expect(laptop.response).to have_http_status(:see_other)
        expect(URI(laptop.response.location).path).to eq(new_user_session_path)
        expect(laptop.flash[:notice]).to eq("You've been signed out on every device.")
        expect(signed_in?(laptop)).to be false
      end

      it "signs out other devices, whose session cookie stops working" do
        phone
        laptop.delete sign_out_everywhere_path

        expect(signed_in?(phone)).to be false
      end

      it "signs out other devices, whose remember cookie stops working" do
        phone
        laptop.delete sign_out_everywhere_path

        lose_session_cookie(phone)
        expect(signed_in?(phone)).to be false
      end

      it "lets the user sign in again afterwards" do
        laptop.delete sign_out_everywhere_path

        expect(signed_in?(sign_in_on_new_device)).to be true
      end

      it "requires a signed-in user" do
        delete sign_out_everywhere_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end

    def sign_in_on_new_device
      open_session.tap do |device|
        device.post user_session_path, params: {
          user: { email: user.email, password: "password", authentication_method: "password", remember_me: "1" }
        }
      end
    end
  end

  def sign_in_with_password(remember_me:)
    post user_session_path, params: {
      user: {
        email: user.email,
        password: "password",
        authentication_method: "password",
        remember_me: remember_me
      }
    }
  end
end
