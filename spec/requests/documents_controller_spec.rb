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

      # Table cells and mentions tell "deleted" from "no access" by these two statuses.
      it "answers 403 with JSON for a document in a space the user can't open" do
        sign_in users(:stefan)
        post select_organization_path(ikigai_systems)
        private_space = ikigai_systems.spaces.create!(name: "Locked Room", access_mode: :private)
        document = private_space.documents.create!(title: "Secret Checklist", organization: ikigai_systems)

        get document_path(document, format: :json)

        expect(response).to have_http_status(:forbidden)
        expect(response.body).not_to include("Secret Checklist")
      end

      it "answers 404 with JSON for a trashed document" do
        document_one.trash!

        get document_path(document_one, format: :json)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "GET /d.json?mention=true" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    it "returns color for a colored document and nil for an uncolored one" do
      document_one.update!(color: "crimson")

      get documents_path(format: :json, mention: true)

      rows = JSON.parse(response.body).index_by { _1["id"] }
      expect(rows[document_one.id]["color"]).to eq("crimson")
      expect(rows.except(document_one.id).values.map { _1["color"] }.uniq).to eq([nil])
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

      context "color" do
        let(:all_names) { HasColor::NAMES.join(", ") }

        def patch_color(document, color)
          patch document_path(document, format: :json), params: { document: { color: color } }, as: :json
        end

        it "sets the color and returns its name" do
          patch_color(document_one, "Indigo")

          expect(response).to have_http_status(:ok)
          expect(response.parsed_body["color"]).to eq("indigo")
          expect(document_one.reload.color).to eq("indigo")
        end

        it "clears the color with an empty string" do
          document_one.update!(color: "blue")

          patch_color(document_one, "")

          expect(response).to have_http_status(:ok)
          expect(response.parsed_body["color"]).to be_nil
          expect(document_one.reload.color).to be_nil
        end

        it "leaves the color unchanged when omitted" do
          document_one.update!(color: "blue")

          patch document_path(document_one, format: :json), params: { document: { title: "Renamed" } }

          expect(response.parsed_body["color"]).to eq("blue")
          expect(document_one.reload.color).to eq("blue")
        end

        it "rejects an unknown color with 422 and a message naming the eight colors" do
          document_one.update!(color: "blue")

          patch_color(document_one, "chartreuse")

          expect(response).to have_http_status(:unprocessable_entity)
          expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
          expect(document_one.reload.color).to eq("blue")
        end

        it "rejects a color that isn't a string with 422" do
          [5, true].each do |value|
            patch_color(document_one, value)

            expect(response).to have_http_status(:unprocessable_entity)
            expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
          end
          expect(document_one.reload.color).to be_nil
        end

        it "rejects a user without edit permission and leaves the color alone" do
          sign_in users(:stefan)
          post select_organization_path(ikigai_systems)
          private_space = ikigai_systems.spaces.create!(name: "Locked Room", access_mode: :private)
          document = private_space.documents.create!(title: "Secret", organization: ikigai_systems, color: "blue")

          patch_color(document, "crimson")

          expect(response).to have_http_status(:forbidden)
          expect(document.reload.color).to eq("blue")
        end

        it "always includes color in the document JSON" do
          get document_path(document_one, format: :json)

          expect(response.parsed_body).to have_key("color")
          expect(response.parsed_body["color"]).to be_nil
        end
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

  describe "color labels in the hierarchy" do
    it "renders data-color on the title of a colored object and none on an uncolored one" do
      sign_in pawel
      post select_organization_path(ikigai_systems)
      space = document_one.space
      space.update!(hierarchy: [{"id" => document_one.id, "children" => [
        {"id" => documents(:two).id, "children" => []},
        {"id" => other_child.id, "children" => []}
      ]}])
      documents(:two).update!(color: "lime")

      get hierarchy_document_path(document_one), headers: {"Turbo-Frame" => "document_hierarchy"}

      html = Nokogiri::HTML(response.body)
      expect(html.at_css("a[href='/d/two'] [data-color='lime']")&.text).to eq("Two")
      expect(html.at_css("a[href='/d/#{other_child.id}']").text).to include("Plain child")
      expect(html.css("a[href='/d/#{other_child.id}'] [data-color]")).to be_empty
    end

    def other_child
      @other_child ||= document_one.space.documents.create!(title: "Plain child", organization: ikigai_systems)
    end
  end
end
