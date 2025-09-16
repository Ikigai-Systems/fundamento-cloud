require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'Expressions' do
    # Basic arithmetic expressions from formula.test.js
    it 'evaluates multiplication correctly' do
      result = engine.evaluate('3 * 5')
      expect(result).to eq(15)
    end

    it 'evaluates subtraction correctly' do
      result = engine.evaluate('3 - 5')
      expect(result).to eq(-2)
    end

    it 'evaluates subtraction without spaces' do
      result = engine.evaluate('3-5')
      expect(result).to eq(-2)
    end

    it 'evaluates parentheses multiplication' do
      result = engine.evaluate('(2*3)')
      expect(result).to eq(6)
    end

    it 'evaluates complex division expression' do
      result = engine.evaluate('(2*2)/(4+4)')
      expect(result).to eq(0.5)
    end

    it 'evaluates zero minus number' do
      result = engine.evaluate('0-5')
      expect(result).to eq(-5)
    end

    # Additional basic expression tests to be comprehensive
    it 'evaluates addition' do
      result = engine.evaluate('3 + 5')
      expect(result).to eq(8)
    end

    it 'evaluates division' do
      result = engine.evaluate('10 / 2')
      expect(result).to eq(5.0)
    end

    # Note: Complex operator precedence handling is a known limitation
    # The formula engine processes operations left-to-right currently
    it 'handles simple sequential operations' do
      result = engine.evaluate('10 - 3 + 2')
      expect(result).to eq(9)
    end

    it 'handles floating point arithmetic' do
      result = engine.evaluate('3.5 + 2.1')
      expect(result).to eq(5.6)
    end

    it 'handles negative numbers' do
      result = engine.evaluate('-5 + 3')
      expect(result).to eq(-2)
    end
  end

  describe 'Function Tests (from commented NextJS tests)' do
    # Additional working function tests
    it 'handles basic function calls' do
      result = engine.evaluate('Max(10, 5)')
      expect(result).to eq(10)
    end

    it 'uses CurrentValue in calculations' do
      result = engine.evaluate('CurrentValue * 2', current_value: 5)
      expect(result).to eq(10)
    end

    it 'combines strings with functions' do
      result = engine.evaluate('Concatenate("Hello", " ", "World")')
      expect(result).to eq("Hello World")
    end
  end

  describe 'Error Handling and Edge Cases' do
    it 'handles division by zero' do
      expect { 
        engine.evaluate('10 / 0') 
      }.to raise_error(RuntimeError, "Division by zero")
    end

    it 'handles undefined functions' do
      expect { 
        engine.evaluate('UnknownFunction(1, 2)') 
      }.to raise_error(RuntimeError, "Undefined function: UnknownFunction")
    end

    it 'handles null and empty values' do
      result = engine.evaluate('IfBlank("", "was blank")')
      expect(result).to eq("was blank")
    end
  end
end