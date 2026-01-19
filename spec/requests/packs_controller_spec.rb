require "rails_helper"

RSpec.describe PacksController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :packs, :spaces

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:test_pack_1) { packs(:test_pack_1) }
  let(:test_pack_2) { packs(:test_pack_2) }

  before do
    # Set up default space for organization so select works
    ikigai_systems.spaces << is_default_space unless ikigai_systems.spaces.include?(is_default_space)
  end

  describe "GET /packs/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "accesses pack via id parameter" do
        get pack_path(test_pack_1)

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "GET /packs/:id/edit" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "accesses pack edit via id parameter" do
        get edit_pack_path(test_pack_1)

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "PATCH /packs/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "updates pack via id parameter" do
        patch pack_path(test_pack_1), params: {
          pack: { name: "Updated Pack Name" }
        }

        test_pack_1.reload
        expect(test_pack_1.name).to eq("Updated Pack Name")
      end
    end
  end

  describe "DELETE /packs/:id" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "deletes pack via id parameter" do
        expect {
          delete pack_path(test_pack_2)
        }.to change(Pack, :count).by(-1)
      end
    end
  end
end
