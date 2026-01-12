require "rails_helper"

RSpec.describe OrganizationsController, type: :request do
  fixtures :organizations, :users, :organization_users, :spaces

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:maria) { users(:maria) }

  describe "POST #select" do
    context "when user has access to the organization" do
      before do
        sign_in maria
      end

      it "redirects to first space with success notice" do
        post select_organization_path(hc_org)

        expect(response).to redirect_to(space_path(hc_org.spaces.first))
        expect(flash[:notice]).to eq("You've been switched to #{hc_org.name}.")
      end
    end

    context "when user does not have access to the organization" do
      before do
        sign_in maria
      end

      it "returns 404 when trying to select organization they are not a member of" do
        # Verify the test data is set up correctly
        expect(maria.organizations).not_to include(is_org)
        expect(maria.organizations).to include(hc_org)

        # Attempt to select the organization they don't belong to
        post select_organization_path(is_org)

        # Should receive 404 Not Found because load_organization uses
        # current_user.organizations.find which raises ActiveRecord::RecordNotFound
        expect(response).to have_http_status(:not_found)
      end

      it "ou_hc_maria should not have access to is organization" do
        # Explicitly verify Maria (ou_hc_maria) cannot access is organization
        expect(OrganizationUser.exists?(organization_id: is_org.id, user_id: maria.id)).to be false
        expect(OrganizationUser.exists?(organization_id: hc_org.id, user_id: maria.id)).to be true

        # Attempt to select the organization they don't belong to should return 404
        post select_organization_path(is_org)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user is not signed in" do
      it "redirects to sign in page" do
        post select_organization_path(hc_org)

        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context "when switching between organizations" do
      before do
        sign_in pawel
      end

      it "successfully switches from one organization to another" do
        post select_organization_path(is_org)
        expect(response).to redirect_to(space_path(is_org.spaces.first))
        expect(flash[:notice]).to eq("You've been switched to #{is_org.name}.")

        post select_organization_path(hc_org)
        expect(response).to redirect_to(space_path(hc_org.spaces.first))
        expect(flash[:notice]).to eq("You've been switched to #{hc_org.name}.")
      end
    end
  end
end
