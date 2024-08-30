require 'rails_helper'

RSpec.describe PublicLinksController, type: :request do
  fixtures :organizations, :spaces, :users, :organization_users, :documents, :public_links

  let(:user) { users(:pawel) }
  let(:document) { documents(:one) }

  before do
    sign_in user

    post select_organization_path(organizations(:is))

    expect(response).to have_http_status(:found)
  end

  describe "POST /public_links" do
    context "with valid attributes" do
      it "creates the public link" do
        expect do
          post public_links_path(format: :json), params: {
            public_link: {
              object_id: document.id,
              object_type: document.class.to_s,
            }
          }

          expect(response).to have_http_status(:created)
        end.to change { PublicLink.count }.by(1)
      end

      it "returns an error when public link already exist" do
        post public_links_path(format: :json), params: {
          public_link: {
            object_id: documents(:two).id,
            object_type: documents(:two).class.to_s,
          }
        }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "PATCH /public_links/:id" do
    let(:public_link) { public_links(:public_link_to_two) }

    it "refreshes the non predictable id" do
      expect do
        patch public_link_path(public_link, params: { public_link: {} })

        expect(response).to have_http_status(:ok)
      end.to change { public_link.reload.npi }.from(public_link.npi).to(be_present)
    end
  end

  describe "DELETE /public_links/:id" do
    let(:public_link) { public_links(:public_link_to_two) }

    it "deletes the public link" do
      expect do
        delete public_link_path(public_link)

        expect(response).to have_http_status(:ok)
      end.to change { PublicLink.count }.by(-1)
    end
  end
end