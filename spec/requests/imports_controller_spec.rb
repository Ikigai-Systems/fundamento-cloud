require "rails_helper"

RSpec.describe ImportsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :document_imports

  let(:manager) { users(:pawel) }
  let(:member) { users(:stefan) }
  let(:organization) { organizations(:hc) }
  let(:public_space) { spaces(:hc_default) }
  let(:restricted_space) { spaces(:hc_restricted) }
  let(:document_import) { document_imports(:hc_import_1) }

  describe "GET #index" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "lists all document imports" do
        get imports_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(document_import.id)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "lists accessible document imports" do
        get imports_path

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        get imports_path

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

      it "shows document import details" do
        get import_path(document_import)

        expect(response).to have_http_status(:ok)
      end

      it "uses NPI in URL (string ID)" do
        import_id = document_import.id
        expect(import_id).to be_a(String)
        expect(import_id.length).to eq(10)

        get import_path(import_id)

        expect(response).to have_http_status(:ok)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can view document imports in accessible spaces" do
        get import_path(document_import)

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

      it "renders new import form" do
        get new_import_path

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Import")
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can access import form" do
        get new_import_path

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "POST #create" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "creates a new document import with file attachment" do
        file = fixture_file_upload("spec/fixtures/test.md", "text/markdown")

        expect {
          post imports_path, params: {
            document_import: {
              space_id: public_space.id,
              file: file
            }
          }
        }.to change(DocumentImport, :count).by(1)

        new_import = DocumentImport.order(:created_at).last
        expect(new_import.id).to be_a(String)
        expect(new_import.id.length).to eq(10)
        expect(new_import.organization).to eq(organization)
        expect(new_import.organization_membership.user).to eq(manager)

        expect(response).to redirect_to(import_path(new_import))
        expect(flash[:notice]).to include("Import started successfully")
      end

      it "renders new form on validation error" do
        post imports_path, params: {
          document_import: {
            space_id: public_space.id,
            file: nil
          }
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include("Import")
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can create imports in spaces with update permission" do
        file = fixture_file_upload("spec/fixtures/test.md", "text/markdown")

        expect {
          post imports_path, params: {
            document_import: {
              space_id: public_space.id,
              file: file
            }
          }
        }.to change(DocumentImport, :count).by(1)

        new_import = DocumentImport.order(:created_at).last
        expect(response).to redirect_to(import_path(new_import))
      end

      it "allows creating imports with valid space" do
        file = fixture_file_upload("spec/fixtures/test.md", "text/markdown")

        # DocumentImportPolicy#create? only checks organization_membership presence,
        # not space-level permissions. Space validation happens at model/controller level.
        expect {
          post imports_path, params: {
            document_import: {
              space_id: restricted_space.id,
              file: file
            }
          }
        }.to change(DocumentImport, :count).by(1)

        expect(response).to redirect_to(import_path(DocumentImport.last))
      end
    end
  end
end
