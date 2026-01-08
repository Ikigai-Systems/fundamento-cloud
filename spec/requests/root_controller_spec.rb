require "rails_helper"

RSpec.describe "Root Controller (EnsureOrganization)", type: :request do
  fixtures :organizations, :users, :organization_users, :spaces

  let(:maria) { users(:maria) }
  let(:pawel) { users(:pawel) }
  let(:john) { users(:john) }
  let(:is_org) { organizations(:is) }
  let(:hc_org) { organizations(:hc) }
  let(:another_org) { organizations(:another) }

  # Helper to sign in a user
  def sign_in(user)
    post user_session_path, params: {
      user: { email: user.email, password: "password" }
    }
  end

  # Helper to set an encrypted organization cookie before a request
  def set_organization_id_cookie(organization_id)
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    jar.encrypted[:organization_id] = organization_id
    cookies[:organization_id] = jar[:organization_id]
  end

  # Helper to get the current organization_id from encrypted cookies
  def current_organization_id_from_cookie
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    jar.encrypted[:organization_id]
  end

  describe "User with one organization" do
    it "auto-selects organization and sets cookie when no cookie exists" do
      sign_in(maria)

      get root_path

      # Should render the page directly (not redirected)
      expect(response).to have_http_status(:ok)
      expect(request.path).to eq("/")

      # Verify cookie was set
      expect(current_organization_id_from_cookie).to eq(hc_org.id)
    end
  end

  describe "User with multiple organizations" do
    it "redirects to organization selection when no cookie exists" do
      sign_in(pawel)

      get root_path

      # Should be redirected to the organizations page
      expect(response).to redirect_to(organizations_path)
      follow_redirect!
      expect(response.body).to include("Please select an organization")
    end

    it "uses valid cookie and loads organization" do
      sign_in(pawel)

      # Set a valid cookie (Pawel has access to hc org)
      set_organization_id_cookie(hc_org.id)

      get root_path

      # Should stay on the root page
      expect(response).to have_http_status(:ok)
      expect(current_organization_id_from_cookie).to eq(hc_org.id)

      # Verify we can access hc org's space
      get "/s/hc_default"
      expect(response).to have_http_status(:ok)

      # Verify we can't access the other organization's space
      get "/s/is_default"
      expect(response).to have_http_status(:not_found)
    end

    it "clears invalid cookie (org doesn't exist) and redirects" do
      sign_in(pawel)

      # Set cookie with non-existent organization
      set_organization_id_cookie("nonexistent")

      get root_path

      # Should be redirected to the organizations page
      expect(response).to redirect_to(organizations_path)
      follow_redirect!
      expect(response.body).to include("Please select an organization")

      # Cookie should be cleared
      expect(current_organization_id_from_cookie).to be_nil
    end

    it "clears invalid cookie (org exists but user not member) and redirects" do
      sign_in(pawel)

      # Set cookie with an organization that exists but Pawel doesn't have access to
      set_organization_id_cookie(another_org.id)

      get root_path

      # Should be redirected to the organizations page
      expect(response).to redirect_to(organizations_path)
      follow_redirect!
      expect(response.body).to include("Please select an organization")

      # Cookie should be cleared
      expect(current_organization_id_from_cookie).to be_nil
    end

    it "clears invalid cookie after user is removed from organization" do
      sign_in(pawel)

      # Initially set a valid cookie
      set_organization_id_cookie(hc_org.id)

      # Remove user from hc organization
      OrganizationUser.find("ou_hc_pawel").destroy

      get root_path

      # After removal, Pawel still has 'is' org, so it should auto-select
      expect(response).to have_http_status(:ok)

      # Cookie should be set to the remaining organization
      expect(current_organization_id_from_cookie).to eq(is_org.id)
    end
  end

  describe "User with no organizations" do
    it "auto-creates organization, sets cookie, and continues" do
      sign_in(john)

      # John should have no organizations initially
      expect(john.organizations.count).to eq(0)

      get root_path

      # May redirect once after creating the organization, then render a page
      if response.redirect?
        follow_redirect!
      end

      # Should render the page (organization auto-created)
      expect(response).to have_http_status(:ok)

      # Verify organization was created
      john.reload
      expect(john.organizations.count).to eq(1)

      # Verify the organization has a generated name
      new_organization = john.organizations.first
      expect(new_organization.name).to be_present
      expect(new_organization.name.split.length).to eq(2) # "Adjective Noun" format

      # Verify user is a manager of the new organization
      org_user = new_organization.organization_users.find_by(user: john)
      expect(org_user.role).to eq("manager")

      # Verify a default space was created
      expect(new_organization.spaces.count).to eq(1)
      expect(new_organization.spaces.first.name).to eq("#{new_organization.name} Space")

      # Make another request to verify cookie persistence
      get root_path
      expect(response).to have_http_status(:ok)
      expect(current_organization_id_from_cookie).to eq(new_organization.id)
    end
  end

  describe "Cookie persistence across page visits" do
    it "maintains organization selection across different pages" do
      sign_in(maria)

      # Visit root - organization should be auto-selected
      get root_path
      expect(response).to have_http_status(:ok)

      # Get the cookie value
      first_cookie_value = current_organization_id_from_cookie
      expect(first_cookie_value).to be_present

      # Visit another page
      get edit_user_registration_path

      # Cookie should persist with the same value
      expect(current_organization_id_from_cookie).to eq(first_cookie_value)
    end
  end

  describe "Switching organizations" do
    it "allows user with multiple orgs to switch via cookie" do
      sign_in(pawel)

      # Set cookie to first org (hc)
      set_organization_id_cookie(hc_org.id)

      get root_path
      expect(response).to have_http_status(:ok)

      # Access hc org's space
      get "/s/hc_default"
      expect(response).to have_http_status(:ok)

      # Change cookie to second org (is)
      set_organization_id_cookie(is_org.id)

      get root_path
      expect(response).to have_http_status(:ok)

      # Should now be able to access is org's space
      get "/s/is_default"
      expect(response).to have_http_status(:ok)

      # Should NOT be able to access hc org's space anymore
      get "/s/hc_default"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "Edge cases" do
    it "handles cookie with malformed value gracefully" do
      sign_in(maria)

      # Set malformed cookie
      set_organization_id_cookie("clearly-not-a-valid-id-123456")

      get root_path

      # For user with 1 org, should recover by setting correct org
      expect(response).to have_http_status(:ok)

      # Cookie should be corrected to valid org
      expect(current_organization_id_from_cookie).to eq(hc_org.id)
    end

    it "handles empty string cookie value" do
      sign_in(pawel)

      set_organization_id_cookie("")

      get root_path

      # Should redirect to organization selection
      expect(response).to redirect_to(organizations_path)
    end

    it "ensures space exists after organization selection" do
      sign_in(maria)

      # Delete all spaces from Maria's organization
      hc_org.spaces.destroy_all
      expect(hc_org.spaces.count).to eq(0)

      get root_path

      # Should create a default space
      hc_org.reload
      expect(hc_org.spaces.count).to eq(1)
      expect(hc_org.spaces.first.name).to eq("Default")
    end
  end

  describe "Organization selection page" do
    it "allows user to select organization and sets cookie" do
      sign_in(pawel)

      # Visit organizations page
      get organizations_path
      expect(response).to have_http_status(:ok)

      # Simulate selecting an organization (this would typically be a POST or PUT)
      # For now, we'll just set the cookie manually and verify behavior
      set_organization_id_cookie(is_org.id)

      get root_path
      expect(response).to have_http_status(:ok)

      # Verify the correct organization is loaded
      expect(current_organization_id_from_cookie).to eq(is_org.id)
    end
  end

  describe "Unauthenticated user" do
    it "does not execute EnsureOrganization callbacks" do
      get root_path

      # Should not set any organization cookie
      expect(current_organization_id_from_cookie).to be_nil
    end
  end
end
