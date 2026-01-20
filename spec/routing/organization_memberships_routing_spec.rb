require "rails_helper"

RSpec.describe "Organization Users routing", type: :routing do
  describe "resourceful routes" do
    it "routes GET /organization_memberships/new to organization_memberships#new" do
      expect(get: "/organization_memberships/new").to route_to(
        controller: "organization_memberships",
        action: "new"
      )
    end

    it "routes POST /organization_memberships to organization_memberships#create" do
      expect(post: "/organization_memberships").to route_to(
        controller: "organization_memberships",
        action: "create"
      )
    end

    it "routes PATCH /organization_memberships/:id to organization_memberships#update" do
      expect(patch: "/organization_memberships/ou_test").to route_to(
        controller: "organization_memberships",
        action: "update",
        id: "ou_test"
      )
    end

    it "routes PUT /organization_memberships/:id to organization_memberships#update" do
      expect(put: "/organization_memberships/ou_test").to route_to(
        controller: "organization_memberships",
        action: "update",
        id: "ou_test"
      )
    end

    it "routes DELETE /organization_memberships/:id to organization_memberships#destroy" do
      expect(delete: "/organization_memberships/ou_test").to route_to(
        controller: "organization_memberships",
        action: "destroy",
        id: "ou_test"
      )
    end
  end

  describe "member routes" do
    it "routes GET /organization_memberships/:id/change_password to organization_memberships#change_password" do
      expect(get: "/organization_memberships/ou_test/change_password").to route_to(
        controller: "organization_memberships",
        action: "change_password",
        id: "ou_test"
      )
    end

    it "routes PATCH /organization_memberships/:id/promote to organization_memberships#promote" do
      expect(patch: "/organization_memberships/ou_test/promote").to route_to(
        controller: "organization_memberships",
        action: "promote",
        id: "ou_test"
      )
    end

    it "routes PATCH /organization_memberships/:id/demote to organization_memberships#demote" do
      expect(patch: "/organization_memberships/ou_test/demote").to route_to(
        controller: "organization_memberships",
        action: "demote",
        id: "ou_test"
      )
    end
  end

  describe "route helpers" do
    it "generates new_organization_membership_path" do
      expect(new_organization_membership_path).to eq("/organization_memberships/new")
    end

    it "generates organization_memberships_path for POST" do
      expect(organization_memberships_path).to eq("/organization_memberships")
    end

    it "generates organization_membership_path with id parameter" do
      expect(organization_membership_path("ou_test")).to eq("/organization_memberships/ou_test")
    end

    it "generates change_password_organization_membership_path" do
      expect(change_password_organization_membership_path("ou_test")).to eq("/organization_memberships/ou_test/change_password")
    end

    it "generates promote_organization_membership_path" do
      expect(promote_organization_membership_path("ou_test")).to eq("/organization_memberships/ou_test/promote")
    end

    it "generates demote_organization_membership_path" do
      expect(demote_organization_membership_path("ou_test")).to eq("/organization_memberships/ou_test/demote")
    end
  end

  describe "param name" do
    it "uses :id instead of :id" do
      expect(get: "/organization_memberships/ou_test/change_password").to route_to(
        controller: "organization_memberships",
        action: "change_password",
        id: "ou_test"
      )
    end

    it "accepts NPI format strings (ou_*)" do
      expect(get: "/organization_memberships/om_is_pawel/change_password").to route_to(
        controller: "organization_memberships",
        action: "change_password",
        id: "om_is_pawel"
      )
    end

    it "accepts various NPI formats" do
      npis = ["ou_test123", "ou_abc_def", "OU_TEST", "ou123"]

      npis.each do |npi|
        expect(get: "/organization_memberships/#{npi}/change_password").to route_to(
          controller: "organization_memberships",
          action: "change_password",
          id: npi
        )
      end
    end
  end

  describe "HTTP method restrictions" do
    it "does not route GET to #destroy" do
      expect(get: "/organization_memberships/ou_test").not_to be_routable
    end

    it "does not route GET to #create" do
      expect(get: "/organization_memberships").not_to be_routable
    end

    it "does not route POST to #promote" do
      expect(post: "/organization_memberships/ou_test/promote").not_to be_routable
    end

    it "does not route POST to #demote" do
      expect(post: "/organization_memberships/ou_test/demote").not_to be_routable
    end
  end

  describe "unrouted actions" do
    it "does not route to #index" do
      expect(get: "/organization_memberships").not_to route_to(
        controller: "organization_memberships",
        action: "index"
      )
    end

    it "does not route to #show" do
      expect(get: "/organization_memberships/ou_test").not_to be_routable
    end

    it "does not route to #edit" do
      expect(get: "/organization_memberships/ou_test/edit").not_to be_routable
    end
  end

  describe "integration with OrganizationMembership model" do
    fixtures :organizations, :users, :organization_memberships

    let(:om_is_pawel) { organization_memberships(:om_is_pawel) }

    it "generates correct path using model id" do
      path = organization_membership_path(om_is_pawel.id)

      expect(path).to eq("/organization_memberships/#{om_is_pawel.id}")
    end

    it "generates correct change_password path using model" do
      path = change_password_organization_membership_path(om_is_pawel)

      expect(path).to eq("/organization_memberships/#{om_is_pawel.to_param}/change_password")
    end

    it "generates correct promote path using model" do
      path = promote_organization_membership_path(om_is_pawel)

      expect(path).to eq("/organization_memberships/#{om_is_pawel.to_param}/promote")
    end

    it "generates correct demote path using model" do
      path = demote_organization_membership_path(om_is_pawel)

      expect(path).to eq("/organization_memberships/#{om_is_pawel.to_param}/demote")
    end
  end

  describe "URL generation options" do
    it "supports additional query parameters" do
      path = organization_membership_path("ou_test", format: :json)

      expect(path).to eq("/organization_memberships/ou_test.json")
    end

    it "supports URL options" do
      path = organization_membership_url("ou_test", only_path: false, host: "example.com")

      expect(path).to eq("http://example.com/organization_memberships/ou_test")
    end
  end
end
