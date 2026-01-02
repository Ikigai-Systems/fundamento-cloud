require "rails_helper"

RSpec.describe FavoritesController, type: :request do
  fixtures :organizations, :users, :organization_users, :spaces, :documents, :favorites

  let(:manager) { users(:pawel) }
  let(:member) { users(:stefan) }
  let(:organization) { organizations(:hc) }
  let(:document_one) { documents(:one) }
  let(:document_two) { documents(:two) }
  let(:favorite) { favorites(:hc_favorite_1) }

  describe "POST #create" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "creates a new favorite" do
        expect {
          post favorites_path, params: {
            favorite: {
              object_id: document_two.id,
              object_type: "Document"
            }
          }, as: :json
        }.to change(Favorite, :count).by(1)

        new_favorite = Favorite.order(:created_at).last
        expect(new_favorite.id).to be_a(String)
        expect(new_favorite.id.length).to eq(10)
        expect(new_favorite.organization_user.user).to eq(manager)
        expect(new_favorite.object).to eq(document_two)

        expect(response).to have_http_status(:created)
      end

      it "renders errors on validation failure" do
        post favorites_path, params: {
          favorite: {
            object_id: nil,
            object_type: "Document"
          }
        }, as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can create favorites" do
        expect {
          post favorites_path, params: {
            favorite: {
              object_id: document_two.id,
              object_type: "Document"
            }
          }, as: :json
        }.to change(Favorite, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        post favorites_path, params: {
          favorite: {
            object_id: document_two.id,
            object_type: "Document"
          }
        }

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "DELETE #destroy" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "destroys favorite" do
        org_user = OrganizationUser.find_by(user: manager, organization: organization)
        favorite_to_destroy = org_user.favorites.create!(
          object: document_two
        )

        expect {
          delete favorite_path(favorite_to_destroy), as: :json
        }.to change(Favorite, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end

      it "uses NPI in URL (string ID)" do
        favorite_id = favorite.id
        expect(favorite_id).to be_a(String)
        expect(favorite_id.length).to eq(10)

        # Just verify the route works with string ID (don't actually delete fixture)
        allow_any_instance_of(Favorite).to receive(:destroy!).and_return(true)

        delete favorite_path(favorite_id), as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "as a member" do
      before do
        sign_in member
        post select_organization_path(organization)
      end

      it "can delete own favorites" do
        org_user = OrganizationUser.find_by(user: member, organization: organization)
        own_favorite = org_user.favorites.create!(
          object: document_two
        )

        expect {
          delete favorite_path(own_favorite), as: :json
        }.to change(Favorite, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "GET #index" do
    context "as a manager" do
      before do
        sign_in manager
        post select_organization_path(organization)
      end

      it "returns favorites as JSON" do
        get favorites_path, as: :json

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
      end

      it "returns favorites as HTML partial" do
        get favorites_path

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not signed in" do
      it "redirects to sign in" do
        get favorites_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
