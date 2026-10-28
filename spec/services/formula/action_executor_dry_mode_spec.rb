require "rails_helper"

RSpec.describe Formula::ActionExecutor, type: :service do
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
  let(:action_executor) { Formula::ActionExecutor.new(dry_mode: true, space: space, organization_membership: organization_membership) }
  let(:engine) { Formula::Engine.new }

  describe '#record_action' do
    it 'records actions with their parameters' do
      action_executor.record_action("AddRow", tableId: "users", values: { "col1" => "val1" })
      
      actions = action_executor.get_actions
      expect(actions).to eq([
        {
          type: "AddRow",
          tableId: "users",
          values: { "col1" => "val1" }
        }
      ])
    end
  end

  describe 'action functions integration' do
    describe 'AddRow' do
      it 'records AddRow action and returns true' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }
        
        formula = 'AddRow("Projects", "column_npi", "test_value")'
        result = engine.evaluate(formula, context:, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddRow",
            tableId: "projects",
            values: {
              "column_npi" => "test_value"
            }
          }
        ])
      end

      it 'works with CurrentRow values' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }
        
        formula = 'AddRow("Projects", "key_col", CurrentRow("Key"), "name_col", CurrentRow("Name"))'
        result = engine.evaluate(formula, context:, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddRow",
            tableId: "projects",
            values: {
              "key_col" => "JIRA",
              "name_col" => "Jira"
            }
          }
        ])
      end
    end

    describe 'DeleteRows' do
      it 'records DeleteRows action' do
        formula = 'DeleteRows("users")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "DeleteRows",
            tableId: "users"
          }
        ])
      end
    end

    describe 'UpdateRows' do
      it 'records UpdateRows action' do
        formula = 'UpdateRows("Users", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "UpdateRows",
            tableId: "users",
            conditionFormula: "condition_formula",
            values: {
              "col1" => "value1",
              "col2" => "value2"
            }
          }
        ])
      end
    end

    describe 'AddOrUpdateRows' do
      it 'records AddOrUpdateRows action' do
        formula = 'AddOrUpdateRows("users", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddOrUpdateRows",
            tableId: "users",
            conditionFormula: "condition_formula",
            values: {
              "col1" => "value1",
              "col2" => "value2"
            }
          }
        ])
      end
    end

    describe 'RunActions' do
      it 'executes nested actions' do
        # First test RunActions directly
        formula = 'RunActions(DeleteRows("Projects"))'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to include(
          hash_including(type: "DeleteRows", tableId: "projects")
        )
        
        # Then test a simple If statement separately
        formula2 = 'AddRow("projects", "status", "completed")'
        result2 = engine.evaluate(formula2, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to include(
          hash_including(type: "AddRow", tableId: "projects")
        )
      end
    end
  end

  describe 'without action tracker' do
    it 'returns regular result when no action tracker provided' do
      formula = 'Max(10, 5)'
      result = engine.evaluate(formula)
      
      expect(result).to eq(10)
    end

    it 'raises error when action function called without tracker' do
      formula = 'AddRow("npi", "col", "val")'
      
      expect {
        engine.evaluate(formula)
      }.to raise_error(RuntimeError, "Undefined function: AddRow")
    end
  end

  describe '#clear' do
    it 'clears all recorded actions' do
      action_executor.record_action("AddRow", tableId: "table1")
      expect(action_executor.has_actions?).to eq(true)
      
      action_executor.clear
      expect(action_executor.has_actions?).to eq(false)
      expect(action_executor.get_actions).to eq([])
    end
  end

  describe "UpdateDocument and UpdateTable" do
    let(:organization) { organizations(:is) }
    let(:document) { Document.create!(title: "Plan", organization: organization, space: space) }
    let!(:new_table) { Table.create!(name: "Backlog", organization: organization, space: space) }

    it "UpdateDocument dry mode records the action and changes nothing" do
      result = action_executor.update_document({}, document.id, {"title" => "Changed", "color" => "blue"})

      expect(result).to be_nil
      expect(action_executor.get_actions).to eq([
        {type: "UpdateDocument", documentId: document.id, values: {"title" => "Changed", "color" => "blue"}}
      ])
      expect(document.reload).to have_attributes(title: "Plan", color: nil)
    end

    it "UpdateTable dry mode records the action and changes nothing" do
      result = action_executor.update_table({}, new_table.id, {"name" => "Changed", "color" => "blue"})

      expect(result).to be_nil
      expect(action_executor.get_actions).to eq([
        {type: "UpdateTable", tableId: new_table.id, values: {"name" => "Changed", "color" => "blue"}}
      ])
      expect(new_table.reload).to have_attributes(name: "Backlog", color: nil)
    end

    it "records through the formula language and changes nothing" do
      engine.evaluate(%(UpdateDocument("#{document.id}", "color", "indigo")), context: {}, action_executor: action_executor)

      expect(action_executor.get_actions).to eq([
        {type: "UpdateDocument", documentId: document.id, values: {"color" => "indigo"}}
      ])
      expect(document.reload.color).to be_nil
    end

    it "a bad id or bad key still errors in dry mode" do
      expect { action_executor.update_document({}, "missing", {"color" => "blue"}) }.to raise_error(ActiveRecord::RecordNotFound)
      expect { action_executor.update_table({}, new_table.id, {"bogus" => "x"}) }.to raise_error(RuntimeError, /UpdateTable accepts/)
      expect(action_executor.get_actions).to be_empty
    end
  end
end
