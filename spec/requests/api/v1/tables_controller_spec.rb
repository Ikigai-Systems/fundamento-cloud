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

    it "returns the icon separately from the name" do
      table = spaces(:hc_default).tables.create!(organization: organizations(:hc), name: "📊 Metrics")

      get_table(table, as: membership)

      expect(response.parsed_body["table"]).to include("name" => "Metrics", "icon" => { "type" => "emoji", "value" => "📊" })
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

  describe "PATCH /api/v1/tables/:id" do
    let(:table) { spaces(:hc_default).tables.create!(organization: organizations(:hc), name: "Metrics") }

    def rename(table, name, as:)
      patch "/api/v1/tables/#{table.id}", params: { table: { name: name } }, headers: bearer(as)
    end

    it "renames the table" do
      rename(table, "KPIs", as: membership)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("id" => table.id, "name" => "KPIs", "space_id" => table.space_id)
      expect(table.reload.name).to eq("KPIs")
    end

    it "sets the icon and returns it" do
      patch "/api/v1/tables/#{table.id}", params: { table: { icon: "📊" } }, headers: bearer(membership)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["icon"]).to eq("type" => "emoji", "value" => "📊")
      expect(table.reload.name).to eq("Metrics")
    end

    it "rejects a request with neither name, icon nor color" do
      patch "/api/v1/tables/#{table.id}", params: { table: { other: "x" } }, headers: bearer(membership)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]["base"]).to eq("Provide a name, icon, color, or any mix")
    end

    context "color" do
      let(:all_names) { HasColor::NAMES.join(", ") }

      def patch_color(table, color, as: membership)
        patch "/api/v1/tables/#{table.id}", params: { table: { color: color } }, headers: bearer(as), as: :json
      end

      it "sets the color and returns its name" do
        patch_color(table, "Indigo")

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to eq("indigo")
        expect(table.reload.color).to eq("indigo")
        expect(table.name).to eq("Metrics")
      end

      it "clears the color with an empty string" do
        table.update!(color: "blue")

        patch_color(table, "")

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to be_nil
        expect(table.reload.color).to be_nil
      end

      it "leaves the color unchanged when omitted" do
        table.update!(color: "blue")

        rename(table, "KPIs", as: membership)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to eq("blue")
        expect(table.reload.color).to eq("blue")
      end

      it "rejects an unknown color with 422 and a message naming the eight colors" do
        table.update!(color: "blue")

        patch_color(table, "chartreuse")

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
        expect(table.reload.color).to eq("blue")
      end

      it "rejects a color that isn't a string with 422" do
        [5, true].each do |value|
          patch_color(table, value)

          expect(response).to have_http_status(:unprocessable_entity)
          expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
        end
        expect(table.reload.color).to be_nil
      end

      it "rejects a user without edit permission and leaves the color alone" do
        private_table = spaces(:hc_pawels).tables.create!(organization: organizations(:hc), name: "Private", color: "blue")

        patch_color(private_table, "crimson")

        expect(response).to have_http_status(:forbidden)
        expect(private_table.reload.color).to eq("blue")
      end

      it "always includes color in the table JSON" do
        rename(table, "KPIs", as: membership)
        expect(response.parsed_body).to have_key("color")

        get_table(table, as: membership)
        expect(response.parsed_body["table"]).to have_key("color")
        expect(response.parsed_body["table"]["color"]).to be_nil
      end
    end

    it "rejects an icon that isn't a single emoji" do
      patch "/api/v1/tables/#{table.id}", params: { table: { icon: "chart" } }, headers: bearer(membership)

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects a name already taken in the space" do
      spaces(:hc_default).tables.create!(organization: organizations(:hc), name: "Taken")

      rename(table, "Taken", as: membership)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(table.reload.name).to eq("Metrics")
    end

    it "refuses a table in another organization" do
      other = spaces(:is_default).tables.create!(organization: organizations(:is), name: "Public in IS")

      rename(other, "Hijacked", as: membership)

      expect(response).to have_http_status(:not_found)
      expect(other.reload.name).to eq("Public in IS")
    end

    it "refuses a user who can't edit the table" do
      private_table = spaces(:hc_pawels).tables.create!(organization: organizations(:hc), name: "Private")

      rename(private_table, "Hijacked", as: membership)

      expect(response).to have_http_status(:forbidden)
      expect(private_table.reload.name).to eq("Private")
    end
  end
end
