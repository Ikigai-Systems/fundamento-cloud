require "rails_helper"

RSpec.describe "Organization Users routing", type: :routing do
  describe "resourceful routes" do
    it "routes GET /organization_users/new to organization_users#new" do
      expect(get: "/organization_users/new").to route_to(
        controller: "organization_users",
        action: "new"
      )
    end

    it "routes POST /organization_users to organization_users#create" do
      expect(post: "/organization_users").to route_to(
        controller: "organization_users",
        action: "create"
      )
    end

    it "routes PATCH /organization_users/:npi to organization_users#update" do
      expect(patch: "/organization_users/ou_test").to route_to(
        controller: "organization_users",
        action: "update",
        npi: "ou_test"
      )
    end

    it "routes PUT /organization_users/:npi to organization_users#update" do
      expect(put: "/organization_users/ou_test").to route_to(
        controller: "organization_users",
        action: "update",
        npi: "ou_test"
      )
    end

    it "routes DELETE /organization_users/:npi to organization_users#destroy" do
      expect(delete: "/organization_users/ou_test").to route_to(
        controller: "organization_users",
        action: "destroy",
        npi: "ou_test"
      )
    end
  end

  describe "member routes" do
    it "routes GET /organization_users/:npi/change_password to organization_users#change_password" do
      expect(get: "/organization_users/ou_test/change_password").to route_to(
        controller: "organization_users",
        action: "change_password",
        npi: "ou_test"
      )
    end

    it "routes PATCH /organization_users/:npi/promote to organization_users#promote" do
      expect(patch: "/organization_users/ou_test/promote").to route_to(
        controller: "organization_users",
        action: "promote",
        npi: "ou_test"
      )
    end

    it "routes PATCH /organization_users/:npi/demote to organization_users#demote" do
      expect(patch: "/organization_users/ou_test/demote").to route_to(
        controller: "organization_users",
        action: "demote",
        npi: "ou_test"
      )
    end
  end

  describe "route helpers" do
    it "generates new_organization_user_path" do
      expect(new_organization_user_path).to eq("/organization_users/new")
    end

    it "generates organization_users_path for POST" do
      expect(organization_users_path).to eq("/organization_users")
    end

    it "generates organization_user_path with npi parameter" do
      expect(organization_user_path("ou_test")).to eq("/organization_users/ou_test")
    end

    it "generates change_password_organization_user_path" do
      expect(change_password_organization_user_path("ou_test")).to eq("/organization_users/ou_test/change_password")
    end

    it "generates promote_organization_user_path" do
      expect(promote_organization_user_path("ou_test")).to eq("/organization_users/ou_test/promote")
    end

    it "generates demote_organization_user_path" do
      expect(demote_organization_user_path("ou_test")).to eq("/organization_users/ou_test/demote")
    end
  end

  describe "param name" do
    it "uses :npi instead of :id" do
      expect(get: "/organization_users/ou_test/change_password").to route_to(
        controller: "organization_users",
        action: "change_password",
        npi: "ou_test"
      )
    end

    it "accepts NPI format strings (ou_*)" do
      expect(get: "/organization_users/ou_is_pawel/change_password").to route_to(
        controller: "organization_users",
        action: "change_password",
        npi: "ou_is_pawel"
      )
    end

    it "accepts various NPI formats" do
      npis = ["ou_test123", "ou_abc_def", "OU_TEST", "ou123"]

      npis.each do |npi|
        expect(get: "/organization_users/#{npi}/change_password").to route_to(
          controller: "organization_users",
          action: "change_password",
          npi: npi
        )
      end
    end
  end

  describe "HTTP method restrictions" do
    it "does not route GET to #destroy" do
      expect(get: "/organization_users/ou_test").not_to be_routable
    end

    it "does not route GET to #create" do
      expect(get: "/organization_users").not_to be_routable
    end

    it "does not route POST to #promote" do
      expect(post: "/organization_users/ou_test/promote").not_to be_routable
    end

    it "does not route POST to #demote" do
      expect(post: "/organization_users/ou_test/demote").not_to be_routable
    end
  end

  describe "unrouted actions" do
    it "does not route to #index" do
      expect(get: "/organization_users").not_to route_to(
        controller: "organization_users",
        action: "index"
      )
    end

    it "does not route to #show" do
      expect(get: "/organization_users/ou_test").not_to be_routable
    end

    it "does not route to #edit" do
      expect(get: "/organization_users/ou_test/edit").not_to be_routable
    end
  end

  describe "integration with OrganizationUser model" do
    fixtures :organizations, :users, :organization_users

    let(:ou_is_pawel) { organization_users(:ou_is_pawel) }

    it "generates correct path using model npi" do
      path = organization_user_path(ou_is_pawel.id)

      expect(path).to eq("/organization_users/#{ou_is_pawel.id}")
    end

    it "generates correct change_password path using model" do
      path = change_password_organization_user_path(ou_is_pawel)

      expect(path).to eq("/organization_users/#{ou_is_pawel.to_param}/change_password")
    end

    it "generates correct promote path using model" do
      path = promote_organization_user_path(ou_is_pawel)

      expect(path).to eq("/organization_users/#{ou_is_pawel.to_param}/promote")
    end

    it "generates correct demote path using model" do
      path = demote_organization_user_path(ou_is_pawel)

      expect(path).to eq("/organization_users/#{ou_is_pawel.to_param}/demote")
    end
  end

  describe "URL generation options" do
    it "supports additional query parameters" do
      path = organization_user_path("ou_test", format: :json)

      expect(path).to eq("/organization_users/ou_test.json")
    end

    it "supports URL options" do
      path = organization_user_url("ou_test", only_path: false, host: "example.com")

      expect(path).to eq("http://example.com/organization_users/ou_test")
    end
  end
end
