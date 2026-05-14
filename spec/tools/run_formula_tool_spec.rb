require "rails_helper"

RSpec.describe RunFormulaTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "with a simple formula" do
      it "evaluates the formula successfully" do
        response = RunFormulaTool.call(
          formula: "1 + 1",
          space_id: nil,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.structured_content["result"]).to eq(2)
        expect(response.structured_content["commands"]).to eq([])
      end

      it "evaluates the formula successfully with space" do
        response = RunFormulaTool.call(
          formula: "1 + 1",
          space_id: space.id,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.structured_content["result"]).to eq(2)
      end
    end

    context "with a formula using built-in functions" do
      it "evaluates string concatenation" do
        response = RunFormulaTool.call(
          formula: "Concatenate(\"Hello\", \" \", \"World\")",
          space_id: nil,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.structured_content["result"]).to eq("Hello World")
      end

      it "evaluates mathematical functions" do
        response = RunFormulaTool.call(
          formula: "Round(3.14159, 2)",
          space_id: nil,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.structured_content["result"]).to eq(3.14)
      end
    end

    context "with an invalid formula" do
      it "returns error in response" do
        response = RunFormulaTool.call(
          formula: "InvalidFunction()",
          space_id: nil,
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.structured_content["error"]).to be_present
        expect(response.structured_content["error"]).to include("Unable to evaluate formula")
      end
    end

    context "with non-existent space" do
      it "returns not found error response" do
        response = RunFormulaTool.call(
          formula: "1 + 1",
          space_id: "nonexistent",
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "with unauthorized space access" do
      let(:server_context) do
        {
          user_id: user.id,
          organization_id: organizations(:another).id
        }
      end

      it "returns not found error response" do
        response = RunFormulaTool.call(
          formula: "1 + 1",
          space_id: space.id,
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(FormulaService).to receive(:evaluate).and_raise(RuntimeError, "Something went wrong")
        response = RunFormulaTool.call(
          formula: "1 + 1",
          space_id: nil,
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end
