require "rails_helper"

RSpec.describe "OrganizationUsers", type: :request do
  include Turbo::Streams::StreamName

  fixtures :organizations, :users, :organization_users, :spaces

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:maria) { users(:maria) }
  let(:john) { users(:john) }

  let(:ou_is_pawel) { organization_users(:ou_is_pawel) } # manager
  let(:ou_is_stefan) { organization_users(:ou_is_stefan) } # member
  let(:ou_hc_maria) { organization_users(:ou_hc_maria) } # member

  describe "GET #new" do
    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "renders new form successfully" do
        get new_organization_user_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("organization_user")
      end

      it "initializes new organization_user with nested user" do
        get new_organization_user_path

        expect(assigns(:organization_user)).to be_a_new(OrganizationUser)
        expect(assigns(:organization_user).user).to be_a_new(User)
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        get new_organization_user_path
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not in organization" do
      before do
        sign_in(john)
        post select_organization_path(is_org)
      end

      it "denies access" do
        result = get new_organization_user_path
        expect(result).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "POST #create" do
    let(:new_user_params) do
      {
        organization_user: {
          user_attributes: {
            email: "newuser@example.com",
            first_name: "New",
            last_name: "User",
            password: "password123",
            password_confirmation: "password123"
          }
        }
      }
    end

    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      context "with valid params for new user" do
        it "creates new user and organization_user" do
          expect {
            post organization_users_path, params: new_user_params
          }.to change(User, :count).by(1)
            .and change(OrganizationUser, :count).by(1)
        end

        it "sets role to :member by default" do
          post organization_users_path, params: new_user_params

          new_org_user = OrganizationUser.order(:created_at).last
          expect(new_org_user.role).to eq("member")
        end

        it "redirects to organization with success notice" do
          post organization_users_path, params: new_user_params

          expect(response).to redirect_to(organization_path(is_org))
          expect(flash[:notice]).to eq("User was successfully created.")
        end

        it "broadcasts Turbo Stream updates" do
          expect {
            post organization_users_path, params: new_user_params
          }.to have_broadcasted_to(stream_name_from(["organization_users_list", is_org]))
        end
      end

      context "when email matches existing user" do
        let(:existing_user_params) do
          {
            organization_user: {
              user_attributes: {
                email: john.email,
                first_name: "John",
                last_name: "Doe",
                password: "password123",
                password_confirmation: "password123"
              }
            }
          }
        end

        it "adds existing user to organization without creating new user" do
          expect {
            post organization_users_path, params: existing_user_params
          }.to change(User, :count).by(0)
            .and change(OrganizationUser, :count).by(1)
        end

        it "uses the existing user account" do
          post organization_users_path, params: existing_user_params

          new_org_user = OrganizationUser.order(:created_at).last
          expect(new_org_user.user).to eq(john)
        end
      end

      context "with invalid params" do
        let(:invalid_params) do
          {
            organization_user: {
              user_attributes: {
                email: "invalid-email",
                first_name: "",
                last_name: "",
                password: "short",
                password_confirmation: "different"
              }
            }
          }
        end

        it "does not create user or organization_user" do
          expect {
            post organization_users_path, params: invalid_params
          }.not_to change(User, :count)
        end

        it "re-renders new template with errors" do
          post organization_users_path, params: invalid_params

          expect(response).to have_http_status(:ok)
          expect(response).to render_template(:new)
        end
      end
    end

    context "when :cloud feature flag is enabled" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "denies access even for managers" do
        with_feature(:cloud) do
          post organization_users_path, params: new_user_params
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        post organization_users_path, params: new_user_params
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET #change_password" do
    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "renders change password form in Turbo frame" do
        get change_password_organization_user_path(ou_is_stefan.id),
          headers: { "Turbo-Frame" => "modal" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("password")
      end

      it "redirects if not a Turbo frame request" do
        get change_password_organization_user_path(ou_is_stefan.id)

        expect(response).to redirect_to(is_org)
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        get change_password_organization_user_path(ou_is_stefan.id),
          headers: { "Turbo-Frame" => "modal" }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH #update (password change)" do
    let(:password_params) do
      {
        organization_user: {
          user_attributes: {
            id: stefan.id,
            password: "newpassword123",
            password_confirmation: "newpassword123"
          }
        }
      }
    end

    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "updates the user's password" do
        patch organization_user_path(ou_is_stefan.id),
          params: password_params,
          headers: { "Turbo-Frame" => "modal" }

        stefan.reload
        expect(stefan.valid_password?("newpassword123")).to be true
      end

      it "responds with Turbo Stream redirect on success" do
        patch organization_user_path(ou_is_stefan.id),
          params: password_params,
          headers: { "Turbo-Frame" => "modal" }

        expect(response).to have_http_status(:ok)
        expect(response.media_type).to eq(Mime[:turbo_stream])
      end

      context "with invalid password" do
        let(:invalid_password_params) do
          {
            organization_user: {
              user_attributes: {
                id: stefan.id,
                password: "short",
                password_confirmation: "different"
              }
            }
          }
        end

        it "does not update password" do
          old_encrypted_password = stefan.encrypted_password

          patch organization_user_path(ou_is_stefan.id),
            params: invalid_password_params,
            headers: { "Turbo-Frame" => "modal" }

          stefan.reload
          expect(stefan.encrypted_password).to eq(old_encrypted_password)
        end

        it "re-renders change_password template with errors" do
          patch organization_user_path(ou_is_stefan.id),
            params: invalid_password_params,
            headers: { "Turbo-Frame" => "modal" }

          expect(response).to render_template(:change_password)
          expect(assigns(:organization_user).errors).not_to be_empty
        end
      end

      it "redirects if not a Turbo frame request" do
        patch organization_user_path(ou_is_stefan.id),
          params: password_params

        expect(response).to redirect_to(is_org)
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        patch organization_user_path(ou_is_stefan.id),
          params: password_params,
          headers: { "Turbo-Frame" => "modal" }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE #destroy" do
    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "removes user from organization" do
        expect {
          delete organization_user_path(ou_is_stefan.id)
        }.to change(OrganizationUser, :count).by(-1)
      end

      it "does not delete the user account" do
        expect {
          delete organization_user_path(ou_is_stefan.id)
        }.not_to change(User, :count)
      end

      it "broadcasts Turbo Stream removal" do
        expect {
          delete organization_user_path(ou_is_stefan.id)
        }.to have_broadcasted_to(stream_name_from(["organization_users_list", is_org]))
      end

      it "redirects to organization with success notice" do
        delete organization_user_path(ou_is_stefan.id)

        expect(response).to redirect_to(is_org)
        expect(flash[:notice]).to eq("User was removed from the organization.")
      end

      context "when trying to remove themselves" do
        it "prevents self-removal and shows notice" do
          expect {
            delete organization_user_path(ou_is_pawel.id)
          }.not_to change(OrganizationUser, :count)

          expect(response).to redirect_to(is_org)
          expect(flash[:notice]).to eq("You can't remove yourself from the organization.")
        end
      end

      context "when removing another manager" do
        before do
          # Create another manager to remove
          @another_manager = OrganizationUser.create!(
            organization: is_org,
            user: john,
            role: :manager
          )
        end

        it "allows removal of other managers" do
          expect {
            delete organization_user_path(@another_manager.id)
          }.to change(OrganizationUser, :count).by(-1)
        end
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        delete organization_user_path(ou_is_stefan.id)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH #promote" do
    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "promotes member to manager" do
        expect {
          patch promote_organization_user_path(ou_is_stefan.id)
        }.to change { ou_is_stefan.reload.role }.from("member").to("manager")
      end

      it "redirects to organization with success notice" do
        patch promote_organization_user_path(ou_is_stefan.id)

        expect(response).to redirect_to(is_org)
        expect(flash[:notice]).to eq("User was promoted to manager.")
      end

      it "broadcasts Turbo Stream update" do
        expect {
          patch promote_organization_user_path(ou_is_stefan.id)
        }.to have_broadcasted_to(stream_name_from(["organization_users_list", is_org]))
      end

      context "when target is already manager" do
        it "raises error or handles gracefully" do
          # Assuming Pundit policy prevents this
          patch promote_organization_user_path(ou_is_pawel.id)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context "when user is member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        patch promote_organization_user_path(ou_is_stefan.id)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH #demote" do
    before do
      # Make stefan a manager so we can test demotion
      ou_is_stefan.update!(role: :manager)
    end

    context "when user is manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "demotes manager to member" do
        expect {
          patch demote_organization_user_path(ou_is_stefan.id)
        }.to change { ou_is_stefan.reload.role }.from("manager").to("member")
      end

      it "redirects to organization with success notice" do
        patch demote_organization_user_path(ou_is_stefan.id)

        expect(response).to redirect_to(is_org)
        expect(flash[:notice]).to eq("Manager was demoted to member.")
      end

      it "broadcasts Turbo Stream update" do
        expect {
          patch demote_organization_user_path(ou_is_stefan.id)
        }.to have_broadcasted_to(stream_name_from(["organization_users_list", is_org]))
      end

      context "when trying to demote themselves" do
        it "prevents self-demotion and shows notice" do
          expect {
            patch demote_organization_user_path(ou_is_pawel.id)
          }.not_to change { ou_is_pawel.reload.role }

          expect(response).to redirect_to(is_org)
          expect(flash[:notice]).to eq("You can't demote yourself.")
        end
      end

      context "when target is already member" do
        before { ou_is_stefan.update!(role: :member) }

        it "raises error or handles gracefully" do
          patch demote_organization_user_path(ou_is_stefan.id)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context "when user is member" do
      before do
        ou_is_stefan.update!(role: :member)
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "denies access" do
        patch demote_organization_user_path(ou_is_pawel.id)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
