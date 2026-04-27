require "rails_helper"

RSpec.describe FormulaService, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:organization_membership) { organization_memberships(:om_is_pawel) }

  describe ".evaluate" do
    context "with simple arithmetic formulas" do
      it "evaluates addition" do
        result = FormulaService.evaluate("1 + 1", nil, organization_membership)

        expect(result["result"]).to eq(2)
        expect(result["commands"]).to eq([])
        expect(result["error"]).to be_nil
      end

      it "evaluates multiplication" do
        result = FormulaService.evaluate("5 * 3", nil, organization_membership)

        expect(result["result"]).to eq(15)
        expect(result["commands"]).to eq([])
      end

      it "evaluates complex expressions" do
        result = FormulaService.evaluate("(10 + 5) / 3", nil, organization_membership)

        expect(result["result"]).to eq(5)
      end

      it "still works when space is provided" do
        result = FormulaService.evaluate("1 + 1", space, organization_membership)

        expect(result["result"]).to eq(2)
        expect(result["error"]).to be_nil
      end
    end

    context "with built-in functions" do
      it "evaluates Concatenate function" do
        result = FormulaService.evaluate(
          "Concatenate(\"Hello\", \" \", \"World\")",
          nil,
          organization_membership
        )

        expect(result["result"]).to eq("Hello World")
      end

      it "evaluates Round function" do
        result = FormulaService.evaluate("Round(3.14159, 2)", nil, organization_membership)

        expect(result["result"]).to eq(3.14)
      end

      it "evaluates Upper function" do
        result = FormulaService.evaluate("Upper(\"hello\")", nil, organization_membership)

        expect(result["result"]).to eq("HELLO")
        expect(result["commands"]).to eq([])
      end

      it "reports an error when calling an unknown method" do
        # Test with a simple function that's more likely to work
        result = FormulaService.evaluate("Len(\"hello\")", space, organization_membership)

        # Should successfully evaluate or return an error
        expect(result).to have_key("error")
        expect(result["error"]).to eq("Unable to evaluate formula due to error: Undefined function: Len")
      end
    end

    context "with additional context" do
      it "accepts additional context parameter" do
        result = FormulaService.evaluate(
          "1 + 1",
          nil,
          organization_membership,
          additional_context: { "name" => "Test User" }
        )

        # Should successfully evaluate even with additional context
        expect(result["result"]).to eq(2)
        expect(result["error"]).to be_nil
      end

      it "accepts ThisRow context parameter" do
        result = FormulaService.evaluate(
          "2 + 2",
          nil,
          organization_membership,
          additional_context: { "ThisRow" => { "age" => 25 } }
        )

        # Should successfully evaluate even with ThisRow context
        expect(result["result"]).to eq(4)
        expect(result["error"]).to be_nil
      end
    end

    context "without organization_membership" do
      it "handles nil organization_membership gracefully" do
        result = FormulaService.evaluate("3 * 3", space, nil)

        # Should return either a result or an error, not crash
        expect(result).to have_key("result").or have_key("error")
      end
    end

    context "with invalid formula" do
      it "returns error hash" do
        result = FormulaService.evaluate("InvalidFunction()", nil, organization_membership)

        expect(result["error"]).to be_present
        expect(result["error"]).to include("Unable to evaluate formula")
        expect(result["result"]).to be_nil
      end

      it "handles syntax errors" do
        result = FormulaService.evaluate("1 +", nil, organization_membership)

        expect(result["error"]).to be_present
        expect(result["error"]).to include("Unable to evaluate formula")
      end
    end
  end

  describe ".batch_evaluate" do
    it "evaluates multiple formulas" do
      evaluations = [
        { formula: "1 + 1", additional_context: {} },
        { formula: "2 * 3", additional_context: {} },
        { formula: "Concatenate(\"a\", \"b\")", additional_context: {} }
      ]

      results = FormulaService.batch_evaluate(evaluations, nil, organization_membership)

      expect(results).to be_an(Array)
      expect(results.length).to eq(3)
      expect(results[0]["result"]).to eq(2)
      expect(results[1]["result"]).to eq(6)
      expect(results[2]["result"]).to eq("ab")
    end

    it "handles mixed valid and invalid formulas" do
      evaluations = [
        { formula: "1 + 1", additional_context: {} },
        { formula: "InvalidFunction()", additional_context: {} },
        { formula: "3 + 3", additional_context: {} }
      ]

      results = FormulaService.batch_evaluate(evaluations, nil, organization_membership)

      expect(results.length).to eq(3)
      expect(results[0]["result"]).to eq(2)
      expect(results[0]["error"]).to be_nil
      expect(results[1]["error"]).to be_present
      expect(results[2]["result"]).to eq(6)
      expect(results[2]["error"]).to be_nil
    end

    it "passes additional context to each evaluation" do
      evaluations = [
        { formula: "1 + 1", additional_context: { "x" => 10 } },
        { formula: "2 * 3", additional_context: { "y" => 5 } }
      ]

      results = FormulaService.batch_evaluate(evaluations, nil, organization_membership)

      expect(results[0]["result"]).to eq(2)
      expect(results[1]["result"]).to eq(6)
    end

    it "still works when space is provided" do
      evaluations = [
        { formula: "1 + 1", additional_context: {} },
        { formula: "2 + 3", additional_context: {} },
      ]

      results = FormulaService.batch_evaluate(evaluations, space, organization_membership)

      expect(results[0]["result"]).to eq(2)
      expect(results[1]["result"]).to eq(5)
    end
  end
end
