require "rails_helper"

RSpec.describe "InvitedUsers::Invitations", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:is_org) { organizations(:is) }
  let(:pawel) { users(:pawel) }
  let(:john) { users(:john) }

  before do
    ActionMailer::Base.deliveries.clear
  end

  describe "POST /invited_users/invitation (create)" do
    before do
      sign_in(pawel)
      post select_organization_path(is_org)
    end

    it "sets invited_by correctly" do
      post invited_user_invitation_path, params: { invited_user: { email: john.email, organization_id: is_org.id } }

      expect(response).to redirect_to(organization_path(is_org))
      expect(InvitedUser.last.invited_by).to eq(pawel)
    end
  end

  describe "GET /invited_users/invitation/accept (edit)" do
    context "when user is already a member of the organization" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: pawel.email,
            organization: is_org
          },
          pawel
        )
      end

      before do
        # Pawel is already in "is" organization
      end

      it "shows 'already a member' message" do
        get accept_invited_user_invitation_path(invitation_token: invited_user.raw_invitation_token)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("You're already a member")
        expect(response.body).to include(is_org.name)
      end
    end

    context "when user is logged in with wrong email" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: john.email,
            organization: is_org
          },
          pawel
        )
      end

      before do
        sign_in(pawel) # Pawel is logged in, but invitation is for John
      end

      it "shows account mismatch message" do
        get accept_invited_user_invitation_path(invitation_token: invited_user.raw_invitation_token)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Account Mismatch")
        expect(response.body).to include(pawel.email)
        expect(response.body).to include(john.email)
        expect(response.body).to include("Sign out")
      end
    end

    context "when user is logged in with correct email" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: john.email,
            organization: is_org
          },
          pawel
        )
      end

      before do
        sign_in(john)
      end

      it "shows accept invitation button" do
        get accept_invited_user_invitation_path(invitation_token: invited_user.raw_invitation_token)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(invited_user.invited_by.display_name)
        expect(response.body).to include(is_org.name)
        expect(response.body).to include("Accept invitation")
        expect(response.body).to include(john.display_name)
      end
    end

    context "when user exists but is not logged in" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: john.email,
            organization: is_org
          },
          pawel
        )
      end

      it "prompts user to sign in" do
        get accept_invited_user_invitation_path(invitation_token: invited_user.raw_invitation_token)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(invited_user.invited_by.display_name)
        expect(response.body).to include("to join")
        expect(response.body).to include(is_org.name)
        expect(response.body).to include("Accept &amp; sign in")
        expect(response.body).to include("already have a Fundamento account")
      end
    end

    context "when user does not exist (new user)" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: "newuser@example.com",
            organization: is_org
          },
          pawel
        )
      end

      it "shows invitation acceptance form" do
        get accept_invited_user_invitation_path(invitation_token: invited_user.raw_invitation_token)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(invited_user.invited_by.display_name)
        expect(response.body).to include("to collaborate in")
        expect(response.body).to include(is_org.name)
        expect(response.body).to include("Accept &amp; create free account")
        expect(response.body).not_to include('invited_user[password]') # No password fields in invitation form
        expect(response.body).not_to include("first_name") # Names not asked anymore
      end
    end
  end

  describe "PUT /invited_users/invitation (update)" do
    context "when accepting invitation for new user" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: "newuser@example.com",
            organization: is_org
          },
          pawel
        )
      end

      let(:valid_params) do
        {
          invited_user: {
            invitation_token: invited_user.raw_invitation_token
          }
        }
      end

      it "creates a new User" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(User, :count).by(1)

        user = User.find_by(email: "newuser@example.com")
        expect(user).to be_present
      end

      it "derives first_name from email" do
        put invited_user_invitation_path, params: valid_params

        user = User.find_by(email: "newuser@example.com")
        expect(user.first_name).to eq("Newuser") # Derived from email
      end

      it "creates organization user in the organization the invitation was for" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(OrganizationMembership, :count).by(1)

        user = User.find_by(email: "newuser@example.com")
        organization_membership = OrganizationMembership.find_by(user: user, organization: is_org)

        expect(organization_membership).to be_present
        # Verify user is in the INVITED organization, not a new one
        expect(user.organizations).to eq([is_org])
      end

      it "assigns member role" do
        put invited_user_invitation_path, params: valid_params

        user = User.find_by(email: "newuser@example.com")
        organization_membership = OrganizationMembership.find_by(user: user, organization: is_org)

        expect(organization_membership.role).to eq("member")
      end

      it "destroys the InvitedUser record" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(InvitedUser, :count).by(-1)

        expect(InvitedUser.find_by(email: "newuser@example.com")).to be_nil
      end

      it "sends confirmation email (cloud mode)" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change { ActionMailer::Base.deliveries.count }.by(1)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include("newuser@example.com")
        expect(email.subject).to include("Confirmation")
      end

      it "creates user with confirmed status" do
        put invited_user_invitation_path, params: valid_params

        user = User.find_by(email: "newuser@example.com")
        expect(user.confirmed?).to be_truthy
        expect(user.confirmation_token).not_to be_present
      end

      it "auto-logs in the user after acceptance" do
        put invited_user_invitation_path, params: valid_params

        # Verify user is logged in by checking the session
        user = User.find_by(email: "newuser@example.com")
        expect(user).to be_present

        # Check that user ID is in the session (indicates logged in)
        expect(session["warden.user.user.key"]).to be_present
        expect(session["warden.user.user.key"].first.first).to eq(user.id)
      end
    end

    context "when user is logged in with correct email" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: john.email,
            organization: is_org
          },
          pawel
        )
      end

      let(:valid_params) do
        {
          invited_user: {
            invitation_token: invited_user.raw_invitation_token
          }
        }
      end

      before do
        sign_in(john)
      end

      it "adds user to organization" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(OrganizationMembership, :count).by(1)

        expect(is_org.users.reload).to include(john)
      end

      it "assigns member role" do
        put invited_user_invitation_path, params: valid_params

        organization_membership = OrganizationMembership.find_by(user: john, organization: is_org)
        expect(organization_membership.role).to eq("member")
      end

      it "destroys the invited user record" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(InvitedUser, :count).by(-1)

        expect(InvitedUser.find_by(email: john.email)).to be_nil
      end

      it "redirects to root and sets organization cookie" do
        put invited_user_invitation_path, params: valid_params

        expect(current_organization_id_from_cookie).to eq(is_org.id)
        expect(response).to redirect_to(root_path)
        expect(flash[:notice]).to include("Welcome to #{is_org.name}")
      end
    end

    context "when user is not logged in" do
      let!(:invited_user) do
        InvitedUser.invite!(
          {
            email: john.email,
            organization: is_org
          },
          pawel
        )
      end

      let(:valid_params) do
        {
          invited_user: {
            invitation_token: invited_user.raw_invitation_token
          }
        }
      end

      it "still works" do
        put invited_user_invitation_path, params: valid_params

        expect(current_organization_id_from_cookie).to eq(is_org.id)
        expect(response).to redirect_to(root_path)
        expect(flash[:notice]).to be_present
      end
    end
  end

  describe "full flow: invitation acceptance followed by email confirmation" do
    let!(:invited_user) do
      InvitedUser.invite!(
        {
          email: "complete@example.com",
          organization: is_org
        },
        pawel
      )
    end

    let(:valid_params) do
      {
        invited_user: {
          invitation_token: invited_user.raw_invitation_token
        }
      }
    end

    it "allows user to confirm email and access organization" do
      # Step 1: Accept invitation (creates user and logs them in)
      put invited_user_invitation_path, params: valid_params

      user = User.find_by(email: "complete@example.com")
      expect(user).to be_present
      expect(user.confirmed?).to be_truthy

      # User should be logged in automatically (check session)
      expect(session["warden.user.user.key"]).to be_present

      # Step 2: Confirm email
      get user_confirmation_path(confirmation_token: user.confirmation_token)

      user.reload
      expect(user.confirmed?).to be true

      # Step 3: Verify access to organization
      get root_path
      expect(response).to have_http_status(:ok)

      # User should be in the INVITED organization as a member
      expect(is_org.users.reload).to include(user)
      organization_membership = OrganizationMembership.find_by(user: user, organization: is_org)
      expect(organization_membership.role).to eq("member")

      # User should have exactly ONE organization (the invited one, not a new auto-created one)
      expect(user.organizations.count).to eq(1)
      expect(user.organizations.first).to eq(is_org)
    end
  end
end
