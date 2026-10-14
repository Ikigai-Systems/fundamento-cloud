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

      context "when the document has children" do
        let(:destination_space) { ikigai_systems.spaces.create!(name: "Destination Space", access_mode: :public) }
        let(:parent) { is_default_space.documents.create!(title: "Parent", organization: ikigai_systems) }
        let(:child) { is_default_space.documents.create!(title: "Child", organization: ikigai_systems) }
        let(:grandchild) { is_default_space.documents.create!(title: "Grandchild", organization: ikigai_systems) }
        let(:sibling) { is_default_space.documents.create!(title: "Sibling", organization: ikigai_systems) }

        before do
          is_default_space.update!(hierarchy: [
            {
              "id" => parent.id,
              "children" => [
                { "id" => child.id, "children" => [{ "id" => grandchild.id, "children" => [] }] }
              ]
            },
            { "id" => sibling.id, "children" => [] }
          ])

          post move_document_path(parent),
            params: { document: { space_id: destination_space.id } },
            headers: { "Turbo-Frame" => "edit_document_#{parent.id}" }
        end

        it "reassigns the whole subtree to the destination space" do
          expect(response).to have_http_status(:ok)

          expect([parent, child, grandchild].map { |document| document.reload.space_id })
            .to all(eq(destination_space.id))
        end

        it "leaves documents outside the subtree in the source space" do
          expect(sibling.reload.space_id).to eq(is_default_space.id)
        end

        it "removes the whole subtree from the source hierarchy" do
          expect(is_default_space.reload.hierarchy).to eq([
            { "id" => sibling.id, "children" => [] }
          ])
        end

        it "appends the subtree to the destination hierarchy with its nesting intact" do
          expect(destination_space.reload.hierarchy).to eq([
            {
              "id" => parent.id,
              "children" => [
                { "id" => child.id, "children" => [{ "id" => grandchild.id, "children" => [] }] }
              ]
            }
          ])
        end
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

  # Every controller that loads a document by param goes through LoadDocument, so this
  # is the one place that decides whether a trashed document is still reachable.
  # The hierarchy JSON keeps a trashed document's node, so the ids it yields are no
  # longer guaranteed to resolve. `find` on an array raises unless every id is found --
  # which would turn one trashed child into a broken page for its parent.
  describe "listing a document's children when one is trashed" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
      is_default_space.update!(hierarchy: [
        { "id" => document_one.id, "children" => [{ "id" => documents(:two).id, "children" => [] }] }
      ])
      documents(:two).trash!(by: pawel)
    end

    it "omits the trashed child instead of failing" do
      get hierarchy_document_path(document_one), headers: { "Turbo-Frame" => "content" }

      expect(response).to have_http_status(:ok)
      expect(response.body).not_to include(documents(:two).title)
    end
  end

  describe "opening a trashed document" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
      document_one.trash!(by: pawel)
    end

    it "is not found" do
      get document_path(document_one)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /d/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "trashes the document instead of destroying it" do
        expect {
          delete document_path(document_one)
        }.not_to change(Document, :count)

        expect(document_one.reload).to be_trashed
        expect(document_one.deleted_by_id).to eq(pawel.id)
      end

      it "hides the trashed document from the space" do
        delete document_path(document_one)

        expect(is_default_space.documents.kept).not_to include(document_one)
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
