require "rails_helper"

# Records are looked up by id in a few places. Knowing an id from another organization
# (a pasted link, a former membership) must not open it. Maria belongs only to "hc";
# every target here lives in "is".
RSpec.describe "Access across organizations", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:maria) { users(:maria) }
  let(:foreign_organization) { organizations(:is) }

  def bearer(membership)
    token = ApiToken.create!(organization: membership.organization, organization_membership: membership, title: "Token")
    { "Authorization" => "Bearer #{token.encrypted_token}" }
  end

  def get_table(table, membership)
    get "/api/v1/tables/#{table.id}", params: { evaluationContext: { space_id: table.space_id } },
      headers: bearer(membership)
  end

  describe "reading a table through the API" do
    it "is refused for a public space of another organization" do
      table = spaces(:is_default).tables.create!(organization: foreign_organization, name: "Public in IS")

      get_table(table, organization_memberships(:om_hc_maria))

      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("Public in IS")
    end

    it "is refused for a private space of another organization, even to a manager" do
      manager_elsewhere = OrganizationMembership.create!(organization: organizations(:another), user: maria, role: :manager)
      table = spaces(:is_stefans).tables.create!(organization: foreign_organization, name: "Private in IS")

      get_table(table, manager_elsewhere)

      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("Private in IS")
    end

    it "still works within the organization" do
      table = spaces(:hc_default).tables.create!(organization: organizations(:hc), name: "Public in HC")

      get_table(table, organization_memberships(:om_hc_maria))

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("table", "name")).to eq("Public in HC")
    end
  end

  describe "inline comment threads" do
    let!(:thread) { InlineCommentThread.create!(id: "foreign_thread", document: documents(:one)) }

    before do
      sign_in maria
      post select_organization_path(organizations(:hc))
    end

    it "can't be resolved from another organization" do
      post "/inline_comments/threads/#{thread.id}/resolve"

      expect(thread.reload.resolved_at).to be_nil
    end

    it "can't be deleted from another organization" do
      delete "/inline_comments/threads/#{thread.id}"

      expect(InlineCommentThread.exists?(thread.id)).to be(true)
    end
  end
end
