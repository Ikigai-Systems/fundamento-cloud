require "rails_helper"

RSpec.describe "Users::Registrations" do
  describe "POST /users (sign up)" do
    let(:user_params_cloud) do
      {
        email: "newuser@example.com",
      }
    end

    let(:user_params_standalone) do
      user_params_cloud.merge(
        password: "password123",
        password_confirmation: "password123",
        first_name: "John",
        last_name: "Doe"
      )
    end

    context "cloud is enabled" do
      before do
        Flipper.disable(:standalone)
      end

      it "creates a new user" do
        expect {
          post user_registration_path, params: { user: user_params_cloud }
        }.to change(User, :count).by(1)
      end

      it "redirects to pending confirmation page" do
        post user_registration_path, params: { user: user_params_cloud }

        expect(response).to redirect_to(users_confirmation_pending_path)
      end

      it "does not sign the user in immediately" do
        post user_registration_path, params: { user: user_params_cloud }

        expect(controller.current_user).to be_nil
      end

      it "sends a confirmation email" do
        expect {
          post user_registration_path, params: { user: user_params_cloud }
        }.to change { ActionMailer::Base.deliveries.count }.by(1)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include("newuser@example.com")
        expect(email.subject).to include("Confirmation")
      end

      it "creates user with unconfirmed status" do
        post user_registration_path, params: { user: user_params_cloud }

        user = User.find_by(email: "newuser@example.com")
        expect(user).to be_present
        expect(user.confirmed?).to be false
        expect(user.confirmation_token).to be_present
      end
    end

    context "standalone is enabled" do
      before do
        Flipper.enable(:standalone)
      end

      it "creates a new user" do
        expect {
          post user_registration_path, params: { user: user_params_standalone }
        }.to change(User, :count).by(1)
      end

      it "auto-confirms the user" do
        post user_registration_path, params: { user: user_params_standalone }

        user = User.find_by(email: "newuser@example.com")
        expect(user).to be_present
        expect(user.confirmed?).to be true
      end

      it "signs the user in immediately" do
        post user_registration_path, params: { user: user_params_standalone }

        expect(controller.current_user).to be_present
        expect(controller.current_user.email).to eq("newuser@example.com")
      end

      it "redirects to root path" do
        post user_registration_path, params: { user: user_params_standalone }

        expect(response).to redirect_to(root_path)
      end

      it "does not send a confirmation email" do
        expect {
          post user_registration_path, params: { user: user_params_standalone }
        }.not_to change { ActionMailer::Base.deliveries.count }
      end
    end

    context "with invalid email" do
      when_feature_both_states(:standalone) do
        it "does not create a user" do
          invalid_params = Flipper.enabled?(:standalone) ? user_params_standalone.merge(email: "invalid") : user_params_cloud.merge(email: "invalid")

          expect {
            post user_registration_path, params: { user: invalid_params }
          }.not_to change(User, :count)

          expect(response).to render_template(:new)
        end
      end
    end
  end
end
