require "rails_helper"

RSpec.describe "Api::V1::Tables", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:membership) { organization_memberships(:om_hc_maria) }

  def bearer(membership)
    token = ApiToken.create!(organization: membership.organization, organization_membership: membership, title: "Token")
    { "Authorization" => "Bearer #{token.encrypted_token}" }
  end

  def get_table(table, as:)
    get "/api/v1/tables/#{table.id}", params: { evaluationContext: { space_id: table.space_id } },
      headers: bearer(as)
  end

  describe "GET /api/v1/tables/:id" do
    it "returns a table in the token's organization" do
      table = spaces(:hc_default).tables.create!(organization: organizations(:hc), name: "Public in HC")

      get_table(table, as: membership)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("table", "name")).to eq("Public in HC")
    end

    # Knowing an id from another organization (a pasted link, a former membership) must not
    # open its table. Maria belongs only to "hc".
    context "with a table in another organization" do
      it "refuses one in a public space" do
        table = spaces(:is_default).tables.create!(organization: organizations(:is), name: "Public in IS")

        get_table(table, as: membership)

        expect(response).to have_http_status(:not_found)
        expect(response.body).not_to include("Public in IS")
      end

      it "refuses one in a private space, even to a manager of another organization" do
        manager_elsewhere = OrganizationMembership.create!(organization: organizations(:another), user: users(:maria), role: :manager)
        table = spaces(:is_stefans).tables.create!(organization: organizations(:is), name: "Private in IS")

        get_table(table, as: manager_elsewhere)

        expect(response).to have_http_status(:not_found)
        expect(response.body).not_to include("Private in IS")
      end
    end
  end
end
