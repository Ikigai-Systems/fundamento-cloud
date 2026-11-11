require "rails_helper"

RSpec.describe "InvitedUsers::Invitations", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:is_org) { organizations(:is) }
  let(:pawel) { users(:pawel) }
  let(:john) { users(:john) }

  before do
    ActionMailer::Base.deliveries.clear
  end

  def invite_to(email, organization, by)
    User.invite!({ email: email }, by, invitation_data: { organization_id: organization.id })
  end

  describe "GET /invited_users/invitation/accept (edit)" do
    context "when user is already a member of the organization" do
      let!(:invited_user) do
        invite_to(pawel.email, is_org, pawel)
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
        invite_to(john.email, is_org, pawel)
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
        invite_to(john.email, is_org, pawel)
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
        # The form must post to the invitations controller, not to the users scope's own.
        expect(response.body).to include('action="/invited_users/invitation"')
      end
    end

    context "when user exists but is not logged in" do
      let!(:invited_user) do
        invite_to(john.email, is_org, pawel)
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
        invite_to("newuser@example.com", is_org, pawel)
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
        invite_to("newuser@example.com", is_org, pawel)
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

      it "consumes the invitation" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(DeviseInvitable::Invitation.pending, :count).by(-1)

        expect(DeviseInvitable::Invitation.pending.where(organization_id: "is")).to be_empty
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
        invite_to(john.email, is_org, pawel)
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

      it "consumes the invitation" do
        expect {
          put invited_user_invitation_path, params: valid_params
        }.to change(DeviseInvitable::Invitation.pending, :count).by(-1)

        expect(DeviseInvitable::Invitation.pending.where(organization_id: "is")).to be_empty
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
        invite_to(john.email, is_org, pawel)
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

    context "when user is logged in with wrong email" do
      let!(:invited_user) do
        invite_to(john.email, is_org, pawel)
      end

      let(:valid_params) do
        {
          invited_user: {
            invitation_token: invited_user.raw_invitation_token
          }
        }
      end

      before do
        sign_in(pawel) # Pawel is logged in, but invitation is for John
      end

      it "prevents acceptance and shows error message" do
        put invited_user_invitation_path, params: valid_params

        expect(flash[:alert]).to include("You must be signed in as #{john.email}")
        expect(response).to redirect_to(accept_invited_user_invitation_path(invitation_token: valid_params[:invited_user][:invitation_token]))

        # Verify invitation was NOT consumed
        expect(DeviseInvitable::Invitation.pending.where(organization_id: "is")).to exist

        # Verify john was NOT added to organization
        expect(is_org.users.reload).not_to include(john)
      end
    end
  end

  describe "POST /invited_users/invitation (create) authorization and resend" do
    let(:stefan) { users(:stefan) }

    def mail_token(mail)
      html = mail.html_part&.body&.decoded || mail.body.decoded
      CGI.parse(URI.parse(html[/href="([^"]*invitation_token[^"]*)"/, 1].gsub("&amp;", "&")).query)["invitation_token"].first
    end

    def invite(email:, organization: is_org)
      post invited_user_invitation_path, params: { invited_user: { email: email, organization_id: organization.id } }
    end

    context "as a manager" do
      before do
        sign_in(pawel)
        post select_organization_path(is_org)
      end

      it "creates a pending invitation for the organization and mails it" do
        expect { invite(email: "fresh@example.com") }
          .to change { is_org.invitations.pending.count }.by(1)
          .and change { ActionMailer::Base.deliveries.count }.by(1)

        mail = ActionMailer::Base.deliveries.last
        expect(mail.to).to eq(["fresh@example.com"])
      end

      it "doesn't invite an existing member, nor send a mail" do
        expect { invite(email: stefan.email) }.not_to change(DeviseInvitable::Invitation.pending, :count)

        expect(ActionMailer::Base.deliveries).to be_empty
        expect(response).to redirect_to(organization_path(is_org))
        expect(flash[:notice]).to include("already a member")
      end

      it "doesn't create an invitation for a blank email" do
        expect { invite(email: "") }.not_to change(DeviseInvitable::Invitation.pending, :count)
      end

      it "invites a registered user who is not yet a member" do
        expect { invite(email: john.email) }.to change(DeviseInvitable::Invitation.pending, :count).by(1)
      end

      it "mails again on resend without adding a second invitation" do
        invite(email: "fresh@example.com")

        expect { invite(email: "fresh@example.com") }
          .to change { ActionMailer::Base.deliveries.count }.by(1)
        expect(is_org.invitations.pending.count).to eq(1)
      end

      it "invalidates the link of the first mail once the invitation is resent" do
        invite(email: "fresh@example.com")
        old_token = mail_token(ActionMailer::Base.deliveries.last)
        invite(email: "fresh@example.com")
        delete destroy_user_session_path

        expect {
          put invited_user_invitation_path, params: { invited_user: { invitation_token: old_token } }
        }.not_to change(User, :count)
        expect(response).to redirect_to(new_user_session_path)
        expect(is_org.users.reload.pluck(:email)).not_to include("fresh@example.com")

        new_token = mail_token(ActionMailer::Base.deliveries.last)
        expect {
          put invited_user_invitation_path, params: { invited_user: { invitation_token: new_token } }
        }.to change(User, :count).by(1)
      end

      it "doesn't let a manager invite to an organization they aren't a member of" do
        invite(email: "fresh@example.com", organization: organizations(:another))

        expect(response).to have_http_status(:not_found)
        expect(DeviseInvitable::Invitation.where(organization_id: "another")).to be_empty
      end
    end

    context "as a plain member" do
      before do
        sign_in(stefan)
        post select_organization_path(is_org)
      end

      it "is not allowed to invite" do
        expect { invite(email: "fresh@example.com") }.not_to change(DeviseInvitable::Invitation.pending, :count)
        expect(response).not_to have_http_status(:ok)
        expect(ActionMailer::Base.deliveries).to be_empty
      end
    end

    context "when signed out" do
      it "doesn't create an invitation" do
        expect { invite(email: "fresh@example.com") }.not_to change(DeviseInvitable::Invitation.pending, :count)
        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "tokens" do
    def accept(token)
      put invited_user_invitation_path, params: { invited_user: { invitation_token: token } }
    end

    let!(:invited_user) { invite_to("late@example.com", is_org, pawel) }

    it "rejects a garbage token and adds nobody" do
      expect { accept("garbage") }.not_to change(OrganizationMembership, :count)
      expect(response).to redirect_to(new_user_session_path)
      expect(User.find_by(email: "late@example.com")).to be_nil
      expect(DeviseInvitable::Invitation.pending.where(organization_id: "is")).to exist
    end

    it "rejects an invitation older than the validity period" do
      token = invited_user.raw_invitation_token

      travel_to(3.weeks.from_now) do
        expect { accept(token) }.not_to change(OrganizationMembership, :count)
        expect(User.find_by(email: "late@example.com")).to be_nil
      end
    end

    it "still accepts one just inside the validity period" do
      token = invited_user.raw_invitation_token

      travel_to(13.days.from_now) do
        expect { accept(token) }.to change(OrganizationMembership, :count).by(1)
      end
    end

    it "rejects a link that was already used" do
      token = invited_user.raw_invitation_token
      accept(token)

      expect { accept(token) }.not_to change(OrganizationMembership, :count)
    end
  end

  describe "the same email invited to two organizations" do
    let(:hc_org) { organizations(:hc) }
    let(:email) { "both@example.com" }
    let!(:to_is) { invite_to(email, is_org, pawel) }
    let!(:to_hc) { invite_to(email, hc_org, pawel) }

    def accept(invitation)
      put invited_user_invitation_path, params: { invited_user: { invitation_token: invitation.raw_invitation_token } }
    end

    it "lets each be accepted on its own, ending with one user in both organizations" do
      expect { accept(to_is) }.to change(User, :count).by(1)
      expect(DeviseInvitable::Invitation.pending.pluck(:organization_id)).to eq(["hc"])

      expect { accept(to_hc) }.not_to change(User, :count)

      user = User.find_by!(email: email)
      expect(user.organizations).to contain_exactly(is_org, hc_org)
      expect(DeviseInvitable::Invitation.pending).to be_empty
    end

    it "accepting the second one first leaves the other pending" do
      accept(to_hc)

      expect(User.find_by!(email: email).organizations).to eq([hc_org])
      expect(DeviseInvitable::Invitation.pending.where(organization_id: "is")).to exist
    end

    it "shows each link its own organization" do
      get accept_invited_user_invitation_path(invitation_token: to_is.raw_invitation_token)
      expect(response.body).to include(is_org.name)
      expect(response.body).not_to include(hc_org.name)

      get accept_invited_user_invitation_path(invitation_token: to_hc.raw_invitation_token)
      expect(response.body).to include(hc_org.name)
      expect(response.body).not_to include(is_org.name)
    end
  end

  describe "a registered user invited to another organization" do
    let(:hc_org) { organizations(:hc) }
    let!(:invitation_user) { invite_to(john.email, hc_org, pawel) }

    it "joins on accept without a second account" do
      expect { put invited_user_invitation_path, params: { invited_user: { invitation_token: invitation_user.raw_invitation_token } } }
        .not_to change(User, :count)

      expect(hc_org.users.reload).to include(john)
    end
  end

  describe "full flow: invitation acceptance followed by email confirmation" do
    let!(:invited_user) do
      invite_to("complete@example.com", is_org, pawel)
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
