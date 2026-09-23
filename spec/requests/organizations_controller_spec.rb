require "rails_helper"

RSpec.describe OrganizationsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:pawel) { users(:pawel) }
  let(:maria) { users(:maria) }

  # Deleting an organization is the single most destructive action in the product: one
  # click used to hard-DELETE the tenant and cascade through a dozen associations, with
  # no recovery short of restoring the whole database to a point in time.
  describe "DELETE #destroy" do
    before { sign_in pawel }

    it "trashes the organization instead of destroying it" do
      delete organization_path(is_org)

      expect(Organization.find_by(id: is_org.id)).to be_present
      expect(is_org.reload).to be_trashed
      expect(is_org.deleted_by_id).to eq(pawel.id)
    end

    it "leaves the organization's data in place" do
      space_ids = is_org.spaces.pluck(:id)
      expect(space_ids).not_to be_empty

      delete organization_path(is_org)

      expect(Space.where(id: space_ids).count).to eq(space_ids.size)
    end

    it "removes the organization from the user's list" do
      delete organization_path(is_org)

      expect(pawel.organizations.reload).not_to include(is_org)
    end
  end

  describe "POST #select" do
    context "when user has access to the organization" do
      before do
        sign_in maria
      end

      it "redirects to first non-archived space (alphabetical) with success notice" do
        expected_space = hc_org.spaces.without_archived.order(:name).first

        post select_organization_path(hc_org)

        expect(response).to redirect_to(space_path(expected_space))
        expect(flash[:notice]).to eq("You've been switched to #{hc_org.name}.")
      end

      it "does not redirect to an archived space" do
        post select_organization_path(hc_org)

        landed_space_id = response.location.split("/s/").last
        expect(Space.find(landed_space_id).archived?).to be false
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

      it "om_hc_maria should not have access to is organization" do
        # Explicitly verify Maria (om_hc_maria) cannot access is organization
        expect(OrganizationMembership.exists?(organization_id: is_org.id, user_id: maria.id)).to be false
        expect(OrganizationMembership.exists?(organization_id: hc_org.id, user_id: maria.id)).to be true

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
        expect(response).to redirect_to(space_path(is_org.spaces.without_archived.order(:name).first))
        expect(flash[:notice]).to eq("You've been switched to #{is_org.name}.")

        post select_organization_path(hc_org)
        expect(response).to redirect_to(space_path(hc_org.spaces.without_archived.order(:name).first))
        expect(flash[:notice]).to eq("You've been switched to #{hc_org.name}.")
      end
    end
  end
end
