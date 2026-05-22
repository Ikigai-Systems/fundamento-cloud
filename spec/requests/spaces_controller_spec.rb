require "rails_helper"

RSpec.describe SpacesController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :teams, :team_memberships

  let(:manager) { users(:pawel) }
  let(:member) { users(:stefan) }
  let(:maria) { users(:maria) }
  let(:organization) { organizations(:hc) }
  let(:public_space) { spaces(:hc_default) }
  let(:private_space) { spaces(:hc_pawels) }
  let(:administrators_space) { spaces(:hc_administrators) }
  let(:team) { teams(:hc_administrators) }

  describe "GET #edit" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "renders edit space form" do
        get edit_space_path(public_space)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit space")
        expect(response.body).to include(public_space.name)
      end

      it "shows space membership multiselect" do
        get edit_space_path(private_space)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("space_managers")
        expect(response.body).to include("multiselect")
      end
    end

    context "as a space manager (via space_membership)" do
      before do
        sign_in member
        post select_organization_path(organizations(:is))
      end

      it "can edit space they manage" do
        # Stefan manages is_stefans via space_membership
        stefans_space = spaces(:is_stefans)

        get edit_space_path(stefans_space)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit space")
      end
    end

    context "as a regular member without permissions" do
      before do
        sign_in maria
        post select_organization_path(organization)
      end

      it "denies access to private space" do
        get edit_space_path(private_space)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows editing public space" do
        get edit_space_path(public_space)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        get edit_space_path(public_space)

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "PATCH #update" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "updates space attributes" do
        patch space_path(public_space), params: {
          space: {
            name: "Updated Space Name",
            access_mode: "restricted",
            space_memberships: [""]
          }
        }

        expect(response).to redirect_to(spaces_path)
        expect(flash[:notice]).to eq("Space was successfully updated.")

        public_space.reload
        expect(public_space.name).to eq("Updated Space Name")
        expect(public_space.access_mode).to eq("restricted")
      end

      it "adds space membership for user" do
        stefan_ou = organization_memberships(:om_hc_stefan)

        expect {
          patch space_path(public_space), params: {
            space: {
              name: public_space.name,
              space_memberships: ["OrganizationMembership|#{stefan_ou.id}"]
            }
          }
        }.to change { public_space.space_memberships.count }.by(1)

        membership = public_space.space_memberships.last
        expect(membership.member_type).to eq("OrganizationMembership")
        expect(membership.member_id).to eq(stefan_ou.id.to_s) # member_id is string
        expect(membership.role).to eq("manager")
      end

      it "adds space membership for team" do
        expect {
          patch space_path(public_space), params: {
            space: {
              name: public_space.name,
              space_memberships: ["Team|#{team.id}"]
            }
          }
        }.to change { public_space.space_memberships.count }.by(1)

        membership = public_space.space_memberships.last
        expect(membership.member_type).to eq("Team")
        expect(membership.member_id).to eq(team.id)
        expect(membership.member_id).to be_a(String) # Team ID is NPI (string)
      end

      it "removes space memberships not in the list" do
        # administrators_space has team membership
        existing_membership = administrators_space.space_memberships.first

        expect {
          patch space_path(administrators_space), params: {
            space: {
              name: administrators_space.name,
              space_memberships: [""] # Empty - remove all
            }
          }
        }.to change { administrators_space.space_memberships.count }.by(-1)

        # Verify membership was deleted
        expect(
          SpaceMembership.where(
            space_id: existing_membership.space_id,
            member_id: existing_membership.member_id,
            member_type: existing_membership.member_type
          ).exists?
        ).to be false
      end

      it "keeps existing memberships that are in the list" do
        # administrators_space has team membership
        existing_membership = administrators_space.space_memberships.first

        expect {
          patch space_path(administrators_space), params: {
            space: {
              name: administrators_space.name,
              space_memberships: ["Team|#{team.id}"] # Keep existing
            }
          }
        }.not_to change { administrators_space.space_memberships.count }

        # Verify membership still exists
        expect(
          SpaceMembership.where(
            space_id: existing_membership.space_id,
            member_id: existing_membership.member_id,
            member_type: existing_membership.member_type
          ).exists?
        ).to be true
      end

      it "updates both attributes and memberships in one request" do
        stefan_ou = organization_memberships(:om_hc_stefan)

        patch space_path(public_space), params: {
          space: {
            name: "Multi-update Space",
            access_mode: "private",
            space_memberships: ["OrganizationMembership|#{stefan_ou.id}"]
          }
        }

        public_space.reload
        expect(public_space.name).to eq("Multi-update Space")
        expect(public_space.access_mode).to eq("private")
        expect(public_space.space_memberships.count).to eq(1)
      end

      it "renders edit form on validation error" do
        patch space_path(public_space), params: {
          space: {
            name: "", # Invalid - name required
            space_memberships: [""]
          }
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Edit space")
      end
    end

    context "as a space manager (via space_membership)" do
      before do
        sign_in member
        post select_organization_path(organizations(:is))
      end

      it "can update space they manage" do
        stefans_space = spaces(:is_stefans)

        patch space_path(stefans_space), params: {
          space: {
            name: "Updated by Space Manager",
            space_memberships: ["OrganizationMembership|#{organization_memberships(:om_is_stefan).id}"]
          }
        }

        expect(response).to redirect_to(spaces_path)

        stefans_space.reload
        expect(stefans_space.name).to eq("Updated by Space Manager")
      end
    end

    context "as a team member managing space via team" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can update space their team manages" do
        # Stefan is in hc_administrators team, which manages administrators_space

        patch space_path(administrators_space), params: {
          space: {
            name: "Updated by Team Member",
            space_memberships: ["Team|#{team.id}"]
          }
        }

        expect(response).to redirect_to(spaces_path)

        administrators_space.reload
        expect(administrators_space.name).to eq("Updated by Team Member")
      end
    end

    context "as a regular member without permissions" do
      before do
        sign_in maria
        post select_organization_path(organization)
      end

      it "denies access to private space" do
        patch space_path(private_space), params: {
          space: {
            name: "Unauthorized Update",
            space_memberships: [""]
          }
        }

        expect(response).to have_http_status(:forbidden)
      end

      it "allows updating public space" do
        patch space_path(public_space), params: {
          space: {
            name: "Public Update",
            space_memberships: [""]
          }
        }

        expect(response).to redirect_to(spaces_path)

        public_space.reload
        expect(public_space.name).to eq("Public Update")
      end
    end
  end

  describe "GET #suggest_owners" do
    before do
      sign_in manager
      post select_organization_path(organization)
    end

    it "returns organization users and teams as JSON" do
      get suggest_owners_spaces_path, params: { q: "", preselects: "" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response).to be_an(Array)

      # Should include both users and teams
      user_results = json_response.select { |item| item["value"].start_with?("OrganizationMembership|") }
      team_results = json_response.select { |item| item["value"].start_with?("Team|") }

      expect(user_results).not_to be_empty
      expect(team_results).not_to be_empty
    end

    it "filters results by query" do
      get suggest_owners_spaces_path, params: { q: "Stefan", preselects: "" }

      json_response = JSON.parse(response.body)

      stefan_result = json_response.find { |item| item["text"].include?("Stefan") }
      expect(stefan_result).to be_present
    end

    it "excludes preselected members" do
      stefan_ou = organization_memberships(:om_hc_stefan)
      preselect_value = "OrganizationMembership|#{stefan_ou.id}"

      get suggest_owners_spaces_path, params: { q: "", preselects: preselect_value }

      json_response = JSON.parse(response.body)
      stefan_result = json_response.find { |item| item["value"] == preselect_value }

      expect(stefan_result).to be_nil
    end

    it "includes teams with NPI IDs" do
      get suggest_owners_spaces_path, params: { q: "Administrators", preselects: "" }

      json_response = JSON.parse(response.body)
      team_result = json_response.find { |item| item["text"] == "Administrators" }

      expect(team_result).to be_present
      expect(team_result["value"]).to eq("Team|#{team.id}")
      expect(team.id).to be_a(String) # Verify team ID is NPI (string)
    end

    it "sorts results alphabetically by name" do
      get suggest_owners_spaces_path, params: { q: "", preselects: "" }

      json_response = JSON.parse(response.body)
      names = json_response.map { |item| item["text"] }

      expect(names).to eq(names.sort)
    end
  end

  describe "GET #index" do
    let(:archived_space) { spaces(:hc_archived) }

    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "includes archived spaces in the listing" do
        get spaces_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(archived_space.name)
      end
    end

    context "as a non-manager (maria)" do
      before do
        sign_in maria
        post select_organization_path(organization)
      end

      it "does not include archived spaces in the listing" do
        get spaces_path

        expect(response).to have_http_status(:ok)
        expect(response.body).not_to include(archived_space.name)
      end
    end
  end

  describe "GET #show" do
    context "as a manager viewing an archived space" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "allows access to the archived space (not 403)" do
        get space_path(spaces(:hc_archived))

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "PUT #update on archived space" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "returns 403 forbidden for archived spaces" do
        patch space_path(spaces(:hc_archived)), params: {
          space: {
            name: "Attempting to update archived",
            space_memberships: [""]
          }
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PUT #archive" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "archives a non-archived space and redirects" do
        put archive_space_path(public_space)

        expect(response).to redirect_to(spaces_path)
        expect(flash[:notice]).to eq("Space was successfully archived.")

        public_space.reload
        expect(public_space.archived?).to be true
      end
    end

    context "as a non-manager (maria)" do
      before do
        sign_in maria
        post select_organization_path(organization)
      end

      it "returns 403 forbidden when trying to archive a private space" do
        put archive_space_path(private_space)

        expect(response).to have_http_status(:forbidden)
      end

      it "returns 403 forbidden when trying to archive a public space" do
        put archive_space_path(public_space)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PUT #unarchive" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "unarchives an archived space and redirects" do
        put unarchive_space_path(spaces(:hc_archived))

        expect(response).to redirect_to(spaces_path)
        expect(flash[:notice]).to eq("Space was successfully unarchived.")

        spaces(:hc_archived).reload
        expect(spaces(:hc_archived).archived?).to be false
      end
    end

    context "as a non-manager (maria)" do
      before do
        sign_in maria
        post select_organization_path(organization)
      end

      it "returns 403 forbidden when trying to unarchive a space" do
        put unarchive_space_path(spaces(:hc_archived))

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PUT #reorder_hierarchy" do
    let(:space) { spaces(:is_default) }
    let!(:doc1) { space.documents.create!(title: "Document 1", organization: organizations(:is)) }
    let!(:doc2) { space.documents.create!(title: "Document 2", organization: organizations(:is)) }
    let!(:doc3) { space.documents.create!(title: "Document 3", organization: organizations(:is)) }

    before do
      sign_in users(:pawel)
      post select_organization_path(organizations(:is))
      space.update!(hierarchy: [
        { "id" => doc1.id, "children" => [] },
        { "id" => doc2.id, "children" => [] },
        { "id" => doc3.id, "children" => [] }
      ])
    end

    context "with valid parameters" do
      it "reorders document to a different position at root level" do
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: nil,
          position: 2
        }

        expect(response).to have_http_status(:ok)

        space.reload
        expect(space.hierarchy[2]["id"]).to eq(doc1.id)
      end

      it "moves document under a parent" do
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: doc2.id,
          position: 0
        }

        expect(response).to have_http_status(:ok)

        space.reload
        expect(space.hierarchy.find { |item| item["id"] == doc2.id }["children"][0]["id"]).to eq(doc1.id)
      end

      it "moves document with children" do
        space.update!(hierarchy: [
          { "id" => doc1.id, "children" => [{ "id" => doc2.id, "children" => [] }] },
          { "id" => doc3.id, "children" => [] }
        ])

        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: nil,
          position: 1
        }

        expect(response).to have_http_status(:ok)

        space.reload
        expect(space.hierarchy[1]["id"]).to eq(doc1.id)
        expect(space.hierarchy[1]["children"][0]["id"]).to eq(doc2.id)
      end
    end

    context "with invalid parameters" do
      it "returns error when document_id is missing" do
        put reorder_hierarchy_space_path(space), params: {
          parent_id: doc2.id,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("document_id is required")
      end

      it "returns error when document does not exist" do
        put reorder_hierarchy_space_path(space), params: {
          document_id: "nonexistent_id",
          parent_id: nil,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Document not found or does not belong to this space")
      end

      it "returns error when document belongs to a different space" do
        other_space = spaces(:hc_default)
        other_doc = other_space.documents.create!(title: "Other Doc", organization: organizations(:hc))

        put reorder_hierarchy_space_path(space), params: {
          document_id: other_doc.id,
          parent_id: nil,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Document not found or does not belong to this space")
      end

      it "returns error when parent document does not exist" do
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: "nonexistent_parent",
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Parent document not found or does not belong to this space")
      end

      it "returns error when parent belongs to a different space" do
        other_space = spaces(:hc_default)
        other_doc = other_space.documents.create!(title: "Other Doc", organization: organizations(:hc))

        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: other_doc.id,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Parent document not found or does not belong to this space")
      end

      it "returns error when document is its own parent" do
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: doc1.id,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Document cannot be its own parent")
      end

      it "returns error when moving document under one of its descendants" do
        # Setup: doc1 -> doc2 -> doc3
        space.update!(hierarchy: [
          { "id" => doc1.id, "children" => [
            { "id" => doc2.id, "children" => [
              { "id" => doc3.id, "children" => [] }
            ] }
          ] }
        ])

        # Try to move doc1 under doc3 (its grandchild)
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: doc3.id,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Cannot move document under one of its descendants")
      end

      it "returns error when moving document under its direct child" do
        # Setup: doc1 -> doc2
        space.update!(hierarchy: [
          { "id" => doc1.id, "children" => [
            { "id" => doc2.id, "children" => [] }
          ] },
          { "id" => doc3.id, "children" => [] }
        ])

        # Try to move doc1 under doc2 (its child)
        put reorder_hierarchy_space_path(space), params: {
          document_id: doc1.id,
          parent_id: doc2.id,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Cannot move document under one of its descendants")
      end

      it "returns error when document is not in hierarchy" do
        orphan_doc = space.documents.create!(title: "Orphan", organization: organizations(:is))

        put reorder_hierarchy_space_path(space), params: {
          document_id: orphan_doc.id,
          parent_id: nil,
          position: 0
        }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Document not found in hierarchy")
      end
    end

    context "authorization" do
      it "denies access when user cannot update space" do
        sign_in users(:maria)
        post select_organization_path(organizations(:hc))

        private_space = spaces(:hc_pawels)

        put reorder_hierarchy_space_path(private_space), params: {
          document_id: doc1.id,
          parent_id: nil,
          position: 0
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
