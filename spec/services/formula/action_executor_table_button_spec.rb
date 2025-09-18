require "rails_helper"

RSpec.describe Formula::ActionExecutor, type: :service do
  fixtures :users
  fixtures :organizations
  fixtures :organization_users
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"
  fixtures "tables/cells"

  let(:space) { spaces(:is_default) }
  let(:organization_user) { organization_users(:ou_is_pawel) }
  let(:table) { tables_tables(:projects) }

  let(:action_executor) { Formula::ActionExecutor.new(dry_mode: false, space: space, organization_user: organization_user) }
  let(:fundamento_functions) { Formula::FundamentoFunctions.new(pundit_user: PolicyUserContext.new(organization_user), space:) }

  let(:engine) {
    Formula::Engine.new(
      additional_functions: fundamento_functions.functions.merge(action_executor.get_action_functions))
  }

  describe "UpdateRows" do
    # CurrentRow requires context - provide a context with currentRow
    let(:context) do
      {
        "ThisRow" => tables_rows(:orders_row_1).npi,
      }
    end

    it "sanity checks" do
      result = engine.evaluate('Table("Orders")', context:, action_executor:)
      expect(result).to include(hash_including("Pizza" => "Hawaii", "Who" => "644366043"))

      result = engine.evaluate('Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who")', context:, action_executor:)
      expect(result).to eq(users(:stefan).id.to_s)

      result = engine.evaluate('String(Dig(User(), "id"))', context:, action_executor:)
      expect(result).to eq(users(:pawel).id.to_s)

      result = engine.evaluate('Join(",", Filter(Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ","), CurrentValue != ""), String(Dig(User(), "id")))', context:, action_executor:)
      expect(result).to eq([users(:stefan).id, organization_user.user.id.to_s].join(","))
    end

    context "original formula" do
      let(:formula) do
        <<EOF
  UpdateRows(
    "Orders",
    CurrentRow("id") == [ThisRow],
    "Who",
    If(
      IndexOf(String(Dig(User(), "id")), Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ",")) != Number("-1"),
      Join(",", Splice(
        Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ","), 
        IndexOf(String(Dig(User(), "id")), Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ",")), 
        1)
      ),
      Join(",", Filter(Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ","), CurrentValue != ""), String(Dig(User(), "id")))
    )
  )
EOF
      end

      it "adds and removes value correctly (persisting existing value)" do
        # User id should be added to the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => [users(:stefan).id, organization_user.user.id.to_s].join(",")))

        # User id should be removed from the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).reload.data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => users(:stefan).id.to_s))
      end

      it "adds and removes value correctly (when there was no existing value)" do
        tables_cells(:orders_hawaii_pizza_who).update!(value: nil)

        # User id should be added to the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => "," + organization_user.user.id.to_s))

        # User id should be removed from the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).reload.data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => ""))
      end
    end

    context "optimized formula" do
      let(:formula) do
        <<EOF
  UpdateRows(
    "Orders",
    CurrentRow("id") == [ThisRow],
    "Who",
    If(
      IndexOf(String(Dig(User(), "id")), Split(CurrentRow("Who"), ",")) != Number("-1"),
      Join(",", Splice(
        Split(CurrentRow("Who"), ","), 
        IndexOf(String(Dig(User(), "id")), Split(CurrentRow("Who"), ",")), 
        1)
      ),
      Join(",", Filter(Split(CurrentRow("Who"), ","), CurrentValue != ""), String(Dig(User(), "id")))
    )
  )
EOF
      end

      it "adds and removes value correctly (persisting existing value)" do
        # User id should be added to the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => [users(:stefan).id, organization_user.user.id.to_s].join(",")))

        # User id should be removed from the row
        engine.evaluate(formula, context: context, action_executor: action_executor)
        expect(tables_tables(:orders).reload.data_to_hash(evaluate_as: users(:pawel))).to include(hash_including("Pizza" => "Hawaii", "Who" => users(:stefan).id.to_s))
      end
    end
  end
end