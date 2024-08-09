require 'rails_helper'

RSpec.describe "DeviseSessions" do
  let(:user) { users(:pawel) }

  fixtures :users

  describe "POST /users/sign_in" do
    context "with valid credentials" do
      it "logs the user in" do
        post user_session_path, params: { user: { email: user.email, password: "password" } }

        expect(response).to redirect_to(root_path)
        expect(controller.current_user).to eq(user)
      end
    end

    context "with invalid credentials" do
      it "does not log the user in" do
        post user_session_path, params: { user: { email: user.email, password: 'wrong password' } }

        expect(response).to render_template(:new)
        expect(controller.current_user).to be_nil
      end
    end
  end
end