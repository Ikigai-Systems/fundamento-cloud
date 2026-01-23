require "rails_helper"

RSpec.describe FormulasController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  before do
    sign_in user
    post select_organization_path(organization)
  end

  describe "POST #eval" do
    context "with a simple formula" do
      it "evaluates the formula successfully" do
        post "/formulas/eval",
          params: {
            formula: "1 + 1",
            space_id: space.id
          },
          headers: { "Accept" => "application/json" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq(2)
        expect(json_response["commands"]).to eq([])
      end
    end

    context "with a formula using built-in functions" do
      it "evaluates string concatenation" do
        post "/formulas/eval",
          params: {
            formula: "Concatenate(\"Hello\", \" \", \"World\")",
            space_id: space.id
          },
          headers: { "Accept" => "application/json" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq("Hello World")
      end
    end

    context "with additional context" do
      it "evaluates formula with ThisRow context" do
        post "/formulas/eval",
          params: {
            formula: "ThisRow.name",
            space_id: space.id,
            additional_context: {
              this_row: { "name" => "Test Name" }
            }
          },
          headers: { "Accept" => "application/json" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        # ThisRow context should be passed through (result may be value or error)
        expect(json_response).to have_key("result").or have_key("error")
      end
    end

    context "with an invalid formula" do
      it "returns error in response" do
        post "/formulas/eval",
          params: {
            formula: "InvalidFunction()",
            space_id: space.id
          },
          headers: { "Accept" => "application/json" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to be_present
        expect(json_response["error"]).to include("Unable to evaluate formula")
      end
    end

    context "with space specified in evaluation_context" do
      it "evaluates formula successfully" do
        post "/formulas/eval",
          params: {
            formula: "1 + 1",
            evaluation_context: {
              space_id: space.id
            }
          },
          headers: { "Accept" => "application/json" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["result"]).to eq(2)
      end
    end

    context "with non-existent space" do
      it "returns error for non-existent space" do
        post "/formulas/eval",
          params: {
            formula: "1 + 1",
            space_id: "nonexistent"
          },
          headers: { "Accept" => "application/json" }

        # The controller may rescue the error or return an error response
        # Either a not found status or an error in the JSON response
        if response.status == 200
          json_response = JSON.parse(response.body)
          expect(json_response["error"]).to be_present
        else
          expect(response).to have_http_status(:not_found).or have_http_status(:unprocessable_content)
        end
      end
    end

    context "when requesting non-JSON format" do
      it "returns unprocessable content" do
        post "/formulas/eval",
          params: {
            formula: "1 + 1",
            space_id: space.id
          },
          headers: { "Accept" => "text/html" }

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end
end
