require "rails_helper"

RSpec.describe DocumentsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:document_one) { documents(:one) }

  describe "GET /d/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "accesses document via id parameter with JSON format" do
        get document_path(document_one, format: :json)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["id"]).to eq(document_one.id)
      end
    end
  end

  describe "GET /d/:id/edit" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "accesses document edit via id parameter" do
        # Skip full rendering by checking controller processing
        allow_any_instance_of(DocumentsController).to receive(:render)
        get edit_document_path(document_one)

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "POST /d/:id/move" do
    context "when authenticated with turbo frame" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "moves document via id parameter" do
        other_space = ikigai_systems.spaces.create!(name: "Other Space")

        post move_document_path(document_one),
          params: { document: { space_id: other_space.id } },
          headers: { "Turbo-Frame" => "edit_document_#{document_one.id}" }

        expect(response).to have_http_status(:ok)
        document_one.reload
        expect(document_one.space_id).to eq(other_space.id)
      end
    end
  end

  describe "GET /d/:id/hierarchy" do
    context "when authenticated with turbo frame" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "accesses document hierarchy via id parameter" do
        get hierarchy_document_path(document_one),
          headers: { "Turbo-Frame" => "document_hierarchy" }

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "PATCH /d/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "updates document via id parameter" do
        patch document_path(document_one, format: :json),
          params: { document: { title: "Updated Title" } }

        document_one.reload
        expect(document_one.title).to eq("Updated Title")
      end
    end
  end

  describe "DELETE /d/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "deletes document via id parameter" do
        expect {
          delete document_path(document_one)
        }.to change(Document, :count).by(-1)
      end
    end
  end

  describe "GET /d/:id/edit with Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders the content_frame layout (contains frame tag, no left sidebar)" do
        get edit_document_path(document_one),
          headers: { "Turbo-Frame" => "content" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="content"')
        expect(response.body).not_to include('id="space-sidebar"')
      end

      it "includes the content_sidebar frame for the document" do
        get edit_document_path(document_one),
          headers: { "Turbo-Frame" => "content" }

        expect(response.body).to include('id="content_sidebar"')
      end
    end
  end

  describe "GET /d/:id/edit without Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders full layout including left sidebar on direct access" do
        get edit_document_path(document_one)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="space-sidebar"')
      end

      it "does not use content_frame layout for other frame requests" do
        get hierarchy_document_path(document_one),
          headers: { "Turbo-Frame" => "document_hierarchy_#{document_one.id}" }

        expect(response).to have_http_status(:ok)
        expect(response.body).not_to include('id="content"')
      end
    end
  end
end
