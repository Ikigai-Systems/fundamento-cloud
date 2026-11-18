require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'Table related formulas' do
    describe 'CurrentRow function access' do
      it 'accesses CurrentRow with column name via function call' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }

        formula = 'Concatenate(CurrentRow("Key"), " ", CurrentRow("Name"))'
        result = engine.evaluate(formula, context:)

        expect(result).to eq("JIRA Jira")
      end

      it 'returns whole CurrentRow when no column specified' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }

        formula = 'CurrentRow()'
        result = engine.evaluate(formula, context:)

        expect(result).to eq({
          "Name" => "Jira",
          "Key" => "JIRA",
        })
      end

      it 'raises error when CurrentRow not available in context' do
        formula = 'CurrentRow("Key")'

        expect {
          engine.evaluate(formula, context: { test: true })
        }.to raise_error(RuntimeError, "Current row is not available in this context")
      end
    end

    describe 'Table function' do
      fixtures :users
      fixtures :organizations
      fixtures :organization_memberships
      fixtures :spaces
      fixtures "tables/tables"
      fixtures "tables/columns"
      fixtures "tables/rows"
      fixtures "tables/cells"

      let(:space) { spaces(:is_default) }
      let(:organization_membership) { organization_memberships(:om_is_pawel) }
      let(:pundit_user) { PolicyUserContext.new(organization_membership) }
      let(:fundamento_functions) { Formula::FundamentoFunctions.new(pundit_user:, space:) }

      let(:engine) { Formula::Engine.new(additional_functions: fundamento_functions.functions) }

      it 'returns empty table data as dummy implementation' do
        formula = "Table(\"#{tables_tables(:projects).id}\")"
        result = engine.evaluate(formula)

        expect(result).to be_a(Array)
        expect(result[0]).to include("Description", "Key", "Name", "Value")
      end

      it 'reports a table that reads itself, instead of overflowing the stack' do
        table = tables_tables(:projects)
        table.columns.create!(name: "Itself", kind: :formula, formula: "Table(\"#{table.id}\")", previous_column: table.columns_in_order.last, organization_id: table.organization_id)

        result = engine.evaluate("Table(\"#{table.id}\")")

        expect(result[0]["Itself"]).to include("Circular reference: Projects -> Projects")
        expect(Thread.current[:formula_tables_being_read]).to be_empty
      end
    end
  end
end