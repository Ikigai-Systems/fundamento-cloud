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
        1
      )),
      Join(",", Filter(Split(Dig(First(Filter(Table("Orders"), Dig(CurrentValue, "id") == [ThisRow])), "Who"), ","), CurrentValue != ""), String(Dig(User(), "id")))
    )
  )
EOF
  end

  let(:executor) { Formula::ActionExecutor.new(dry_mode: false, space: space, organization_user: organization_user) }
  let(:fundamento_functions) { Formula::FundamentoFunctions.new(pundit_user: PolicyUserContext.new(organization_user), space:) }

  let(:engine) {
    Formula::Engine.new(
      additional_functions: fundamento_functions.functions.merge(executor.get_action_functions))
  }


  describe "UpdateRows" do
    it "handles complex cases" do
      # CurrentRow requires context - provide a context with currentRow
      context = {
        "ThisRow" => tables_rows(:orders_row_1).attributes,
      }
      
      result = engine.evaluate(formula, context: context, action_executor: executor)

      expect(result).to eq(true)
    end
  end
end