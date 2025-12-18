require "rails_helper"

RSpec.describe "Users::Registrations" do
  describe "POST /users (sign up)" do
    let(:user_params) do
      {
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }
    end

    let(:user_params_with_name) do
      user_params.merge(
        first_name: "John",
        last_name: "Doe"
      )
    end

    context "when email confirmation is required" do
      before do
        # Ensure confirmable is enabled
        allow(User).to receive(:devise_modules).and_return([:confirmable, :database_authenticatable, :registerable])
      end

      it "creates a new user" do
        params_to_use = Rails.env.standalone? ? user_params_with_name : user_params

        expect {
          post user_registration_path, params: { user: params_to_use }
        }.to change(User, :count).by(1)
      end

      it "redirects to pending confirmation page" do
        params_to_use = Rails.env.standalone? ? user_params_with_name : user_params

        post user_registration_path, params: { user: params_to_use }

        expect(response).to redirect_to(users_confirmation_pending_path)
      end

      it "does not sign the user in immediately" do
        params_to_use = Rails.env.standalone? ? user_params_with_name : user_params

        post user_registration_path, params: { user: params_to_use }

        expect(controller.current_user).to be_nil
      end

      it "sends a confirmation email" do
        params_to_use = Rails.env.standalone? ? user_params_with_name : user_params

        expect {
          post user_registration_path, params: { user: params_to_use }
        }.to change { ActionMailer::Base.deliveries.count }.by(1)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include("newuser@example.com")
        expect(email.subject).to include("Confirmation")
      end

      it "creates user with unconfirmed status" do
        params_to_use = Rails.env.standalone? ? user_params_with_name : user_params

        post user_registration_path, params: { user: params_to_use }

        user = User.find_by(email: "newuser@example.com")
        expect(user).to be_present
        expect(user.confirmed?).to be false
        expect(user.confirmation_token).to be_present
      end
    end

    context "with invalid email" do
      it "does not create a user" do
        invalid_params = Rails.env.standalone? ? user_params_with_name.merge(email: "invalid") : user_params.merge(email: "invalid")

        expect {
          post user_registration_path, params: { user: invalid_params }
        }.not_to change(User, :count)

        expect(response).to render_template(:new)
      end
    end
  end

end
