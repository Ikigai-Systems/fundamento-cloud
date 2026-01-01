require "rails_helper"

RSpec.describe AutomationsController, type: :request do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :automations

  let(:manager) { users(:pawel) }
  let(:member) { users(:stefan) }
  let(:organization) { organizations(:hc) }
  let(:public_space) { spaces(:hc_default) }
  let(:restricted_space) { spaces(:hc_restricted) }
  let(:private_space) { spaces(:hc_pawels) }
  let(:automation) { automations(:hc_webhook_automation) }

  describe "GET #index" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "lists all automations in the space" do
        get space_automations_path(public_space)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(automation.title)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "lists automations in accessible spaces" do
        get space_automations_path(public_space)

        expect(response).to have_http_status(:ok)
      end

      it "can access automations in spaces with membership" do
        # Stefan has access to hc_pawels through space membership
        get space_automations_path(private_space)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        get space_automations_path(public_space)

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "GET #show" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "shows automation details" do
        get space_automation_path(public_space, automation)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(automation.title)
      end

      it "uses NPI in URL (string ID)" do
        automation_id = automation.id
        expect(automation_id).to be_a(String)

        get space_automation_path(public_space, automation_id)

        expect(response).to have_http_status(:ok)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can view automations in public spaces" do
        get space_automation_path(public_space, automation)

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "GET #new" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "renders new automation form" do
        get new_space_automation_path(public_space)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Create automation")
      end
    end

    context "as a member without update permission" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access to create automation" do
        get new_space_automation_path(restricted_space)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST #create" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "creates a new automation" do
        expect {
          post space_automations_path(public_space), params: {
            automation: {
              title: "New Automation",
              kind: "webhook",
              formula: "2 + 2"
            }
          }
        }.to change(Automation, :count).by(1)

        new_automation = Automation.last
        expect(new_automation.title).to eq("New Automation")
        expect(new_automation.kind).to eq("webhook")
        expect(new_automation.formula).to eq("2 + 2")
        expect(new_automation.space).to eq(public_space)
        expect(new_automation.organization).to eq(organization)
        expect(new_automation.run_as).to eq(organization_users(:ou_hc_pawel))
        expect(new_automation.id).to be_a(String) # NPI is a string
        expect(new_automation.id.length).to eq(10) # NPI is 10 characters

        expect(response).to redirect_to(space_automation_path(public_space, new_automation))
        expect(flash[:notice]).to eq("Automation was successfully created.")
      end

      it "renders new form on validation error" do
        post space_automations_path(public_space), params: {
          automation: {
            title: "",
            kind: "webhook",
            formula: ""
          }
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Create automation")
      end
    end

    context "as a member without update permission" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        post space_automations_path(restricted_space), params: {
          automation: {
            title: "Unauthorized Automation",
            kind: "webhook",
            formula: "1 + 1"
          }
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET #edit" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "renders edit automation form" do
        get edit_space_automation_path(public_space, automation)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit automation")
        expect(response.body).to include(automation.title)
      end
    end

    context "as a member without update permission" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        restricted_automation = automations(:hc_restricted_automation)
        get edit_space_automation_path(restricted_space, restricted_automation)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH #update" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "updates automation" do
        patch space_automation_path(public_space, automation), params: {
          automation: {
            title: "Updated Automation Title",
            formula: "5 + 5"
          }
        }

        expect(response).to redirect_to(space_automation_path(public_space, automation))
        expect(flash[:notice]).to eq("Automation was successfully updated.")

        automation.reload
        expect(automation.title).to eq("Updated Automation Title")
        expect(automation.formula).to eq("5 + 5")
      end

      it "does not allow updating kind" do
        original_kind = automation.kind

        patch space_automation_path(public_space, automation), params: {
          automation: {
            title: automation.title,
            kind: "different_kind"
          }
        }

        automation.reload
        expect(automation.kind).to eq(original_kind) # Kind should not change
      end

      it "renders edit form on validation error" do
        patch space_automation_path(public_space, automation), params: {
          automation: {
            title: "", # Invalid - title required
            formula: automation.formula
          }
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit automation")
      end
    end

    context "as a member without update permission" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        restricted_automation = automations(:hc_restricted_automation)
        patch space_automation_path(restricted_space, restricted_automation), params: {
          automation: {
            title: "Unauthorized Update"
          }
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE #destroy" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "destroys automation" do
        automation_to_destroy = public_space.automations.create!(
          organization: organization,
          run_as: organization_users(:ou_hc_pawel),
          title: "To Delete",
          kind: "webhook",
          formula: "1"
        )

        expect {
          delete space_automation_path(public_space, automation_to_destroy)
        }.to change(Automation, :count).by(-1)

        expect(response).to redirect_to(space_automations_path(public_space))
        expect(flash[:notice]).to eq("Automation was successfully deleted.")
      end

      it "uses NPI in URL (string ID)" do
        automation_id = automation.id
        expect(automation_id).to be_a(String)

        # Just verify the route works with string ID (don't actually delete fixture)
        # We'll use a stub to prevent deletion
        allow_any_instance_of(Automation).to receive(:destroy!).and_return(true)

        delete space_automation_path(public_space, automation_id)

        expect(response).to redirect_to(space_automations_path(public_space))
      end
    end

    context "as a member without update permission" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        restricted_automation = automations(:hc_restricted_automation)
        delete space_automation_path(restricted_space, restricted_automation)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
