require "rails_helper"

RSpec.describe Formula::ActionExecutor, type: :service do
  let(:action_executor) { Formula::ActionExecutor.new(dry_mode: true) }
  let(:engine) { Formula::Engine.new }

  describe '#record_action' do
    it 'records actions with their parameters' do
      action_executor.record_action("AddRow", tableNpi: "table1", values: { "col1" => "val1" })
      
      actions = action_executor.get_actions
      expect(actions).to eq([
        {
          type: "AddRow",
          tableNpi: "table1", 
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
        
        formula = 'AddRow("npi", "column_npi", "test_value")'
        result = engine.evaluate(formula, context:, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddRow",
            tableNpi: "npi",
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
        
        formula = 'AddRow("npi", "key_col", CurrentRow("Key"), "name_col", CurrentRow("Name"))'
        result = engine.evaluate(formula, context:, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddRow",
            tableNpi: "npi",
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
        formula = 'DeleteRows("table_npi")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "DeleteRows",
            tableNpi: "table_npi"
          }
        ])
      end
    end

    describe 'UpdateRows' do
      it 'records UpdateRows action' do
        formula = 'UpdateRows("table_npi", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "UpdateRows",
            tableNpi: "table_npi",
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
        formula = 'AddOrUpdateRows("table_npi", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq([
          {
            type: "AddOrUpdateRows",
            tableNpi: "table_npi",
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
        formula = 'RunActions(DeleteRows("npi"))'
        result = engine.evaluate(formula, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to include(
          hash_including(type: "DeleteRows", tableNpi: "npi")
        )
        
        # Then test a simple If statement separately
        formula2 = 'AddRow("npi", "status", "completed")'
        result2 = engine.evaluate(formula2, action_executor:)
        
        expect(result).to eq(true)
        expect(action_executor.get_actions).to include(
          hash_including(type: "AddRow", tableNpi: "npi")
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
      action_executor.record_action("AddRow", tableNpi: "table1")
      expect(action_executor.has_actions?).to eq(true)
      
      action_executor.clear
      expect(action_executor.has_actions?).to eq(false)
      expect(action_executor.get_actions).to eq([])
    end
  end
end