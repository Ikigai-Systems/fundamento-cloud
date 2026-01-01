require "rails_helper"

RSpec.describe TeamsController, type: :request do
  fixtures :organizations, :users, :organization_users, :teams, :team_memberships, :spaces

  let(:manager) { users(:pawel) }
  let(:member) { users(:stefan) }
  let(:organization) { organizations(:hc) }
  let(:team) { teams(:hc_administrators) }

  describe "GET #index" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "lists all teams" do
        get teams_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(team.name)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "lists all teams" do
        get teams_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(team.name)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        get teams_path

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

      it "shows team details" do
        get team_path(team)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(team.name)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "shows team details" do
        get team_path(team)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(team.name)
      end
    end
  end

  describe "GET #new" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "renders new team form" do
        get new_team_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Create team")
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        get new_team_path

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

      it "creates a new team" do
        expect {
          post teams_path, params: {
            team: {
              name: "New Team",
              shortcut: "@newteam",
              team_memberships: [""]
            }
          }
        }.to change(Team, :count).by(1)

        expect(response).to redirect_to(team_path(Team.last))
        expect(flash[:notice]).to eq("Team was successfully created.")

        new_team = Team.last
        expect(new_team.name).to eq("New Team")
        expect(new_team.shortcut).to eq("@newteam")
        expect(new_team.organization).to eq(organization)
        expect(new_team.id).to be_a(String) # NPI is a string
        expect(new_team.id.length).to eq(10) # NPI is 10 characters
      end

      it "renders new form on validation error" do
        post teams_path, params: {
          team: {
            name: "",
            shortcut: "",
            team_memberships: [""]
          }
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Create team")
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        post teams_path, params: {
          team: {
            name: "New Team",
            shortcut: "@newteam",
            team_memberships: [""]
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

      it "renders edit team form" do
        get edit_team_path(team)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit team")
        expect(response.body).to include(team.name)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        get edit_team_path(team)

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

      it "updates team" do
        patch team_path(team), params: {
          team: {
            name: "Updated Team Name",
            shortcut: "@updated",
            team_memberships: [""]
          }
        }

        expect(response).to redirect_to(team_path(team))
        expect(flash[:notice]).to eq("Team was successfully updated.")

        team.reload
        expect(team.name).to eq("Updated Team Name")
        expect(team.shortcut).to eq("@updated")
      end

      it "renders edit form on validation error" do
        patch team_path(team), params: {
          team: {
            name: "",
            shortcut: "",
            team_memberships: [""]
          }
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit team")
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        patch team_path(team), params: {
          team: {
            name: "Updated Team Name",
            shortcut: "@updated",
            team_memberships: [""]
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

      it "destroys team" do
        team_to_destroy = organization.teams.create!(name: "To Delete", shortcut: "@delete")

        expect {
          delete team_path(team_to_destroy)
        }.to change(Team, :count).by(-1)

        expect(response).to redirect_to(teams_path)
        expect(flash[:notice]).to eq("Team was removed.")
      end

      it "uses NPI in URL (string ID)" do
        team_id = team.id
        expect(team_id).to be_a(String)

        delete team_path(team_id)

        expect(response).to redirect_to(teams_path)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "denies access" do
        delete team_path(team)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET #suggest_members" do
    before do
      sign_in manager
      post select_organization_path(organization)
    end

    it "returns organization users as JSON" do
      get suggest_members_teams_path, params: { q: "stefan", preselects: "" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response).to be_an(Array)
      stefan_result = json_response.find { |ou| ou["text"].include?("Stefan") }
      expect(stefan_result).to be_present
      expect(stefan_result["value"]).to match(/OrganizationUser\|/)
    end

    it "excludes preselected members" do
      stefan_ou = organization.organization_users.find_by(user: member)
      preselect_value = "OrganizationUser|#{stefan_ou.id}"

      get suggest_members_teams_path, params: { q: "", preselects: preselect_value }

      json_response = JSON.parse(response.body)
      stefan_result = json_response.find { |ou| ou["value"] == preselect_value }

      expect(stefan_result).to be_nil
    end
  end
end
