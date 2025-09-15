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
        result = engine.evaluate(formula, context)
        
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
        result = engine.evaluate(formula, context)
        
        expect(result).to eq({
          "Name" => "Jira",
          "Key" => "JIRA",
        })
      end

      it 'raises error when CurrentRow not available in context' do
        formula = 'CurrentRow("Key")'
        
        expect { 
          engine.evaluate(formula)
        }.to raise_error(RuntimeError, "Current row is not available in this context")
      end
    end

    xdescribe 'Table function' do
      it 'returns empty table data as dummy implementation' do
        formula = 'Table("some_table_npi")'
        result = engine.evaluate(formula)
        
        expect(result[:result]).to eq([])
        expect(result[:commands]).to eq([])
      end
    end
  end
end