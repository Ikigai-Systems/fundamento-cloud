require "rails_helper"

RSpec.describe Tables::TablesController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, "tables/tables"

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:table) { tables_tables(:projects) }

  describe "GET /t/:id with Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders the content_frame layout (contains frame tag, no left sidebar)" do
        get table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="content"')
        expect(response.body).not_to include('id="space-sidebar"')
      end

      it "includes the content_sidebar frame for the table" do
        get table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response.body).to include('id="content_sidebar"')
      end

      it "renders edit in content_frame layout" do
        get edit_table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="content"')
      end
    end
  end

  describe "GET /t/:id without Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders full layout including left sidebar on direct access" do
        get table_path(table)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="space-sidebar"')
      end
    end
  end

  describe "the History menu item" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    # link_to_with_disable renders a bare span when disabled, which is not clickable.
    # A table with no versions should still be able to reach the page that explains why.
    it "is a real link even when the table has no versions yet" do
      expect(table.versions).to be_empty

      get table_path(table)

      # A link, not the <span> link_to_with_disable renders for a disabled entry.
      expect(response.body).to include(%(href="#{table_version_path(table, "latest")}">History</a>))
    end
  end
end
