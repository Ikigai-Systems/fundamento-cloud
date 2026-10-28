require 'rails_helper'

RSpec.describe PublicLinksController, type: :request do
  fixtures :organizations, :spaces, :users, :organization_memberships, :documents, :public_links

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

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "PATCH /public_links/:id" do
    let(:document) { documents(:two) }
    let(:public_link) { public_links(:public_link_to_two) }

    it "refreshes the non predictable id" do
      expect do
        patch public_link_path(public_link, params: { public_link: {}, refresh: true }, format: :json)

        expect(response).to have_http_status(:ok)
      end.to change { document.reload.public_link.id }.from(public_link.id).to(be_present)
    end
  end

  describe "DELETE /public_links/:id" do
    let(:public_link) { public_links(:public_link_to_two) }

    it "deletes the public link" do
      expect do
        delete public_link_path(public_link, format: :json)

        expect(response).to have_http_status(:ok)
      end.to change { PublicLink.count }.by(-1)
    end
  end

  describe "GET /public_links" do
    it "renders data-color on the title of a colored object and none on an uncolored one" do
      two_link = public_links(:public_link_to_two)
      one_link = PublicLink.create!(organization: organizations(:is), object: document, updated_by: user)
      document.update!(color: "crimson")

      get public_links_path

      html = Nokogiri::HTML(response.body)
      expect(html.at_css("tr##{ActionView::RecordIdentifier.dom_id(one_link)} [data-color='crimson']")&.text).to eq("One")
      row = html.at_css("tr##{ActionView::RecordIdentifier.dom_id(two_link)}")
      expect(row.text).to include("Two")
      expect(row.css("[data-color]")).to be_empty
    end
  end
end
