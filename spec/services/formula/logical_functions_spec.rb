require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'logical functions' do
    describe 'And function' do
      it 'returns true when both arguments are true' do
        result = engine.evaluate('And(True(), True())')
        expect(result).to eq(true)
      end

      it 'returns false when first argument is true and second is false' do
        result = engine.evaluate('And(True(), False())')
        expect(result).to eq(false)
      end

      it 'returns false when first argument is false and second is true' do
        result = engine.evaluate('And(False(), True())')
        expect(result).to eq(false)
      end

      it 'returns false when both arguments are false' do
        result = engine.evaluate('And(False(), False())')
        expect(result).to eq(false)
      end

      it 'handles truthy values' do
        result = engine.evaluate('And(1, 2)')
        expect(result).to eq(true)
      end

      it 'handles falsy values' do
        result = engine.evaluate('And(0, 1)')
        expect(result).to eq(false)
      end

      it 'handles mixed truthy and falsy values' do
        result = engine.evaluate('And(5, 0)')
        expect(result).to eq(false)
      end
    end

    describe 'Or function' do
      it 'returns true when both arguments are true' do
        result = engine.evaluate('Or(True(), True())')
        expect(result).to eq(true)
      end

      it 'returns true when first argument is true and second is false' do
        result = engine.evaluate('Or(True(), False())')
        expect(result).to eq(true)
      end

      it 'returns true when first argument is false and second is true' do
        result = engine.evaluate('Or(False(), True())')
        expect(result).to eq(true)
      end

      it 'returns false when both arguments are false' do
        result = engine.evaluate('Or(False(), False())')
        expect(result).to eq(false)
      end

      it 'handles truthy values' do
        result = engine.evaluate('Or(1, 0)')
        expect(result).to eq(true)
      end

      it 'handles falsy values' do
        result = engine.evaluate('Or(0, 0)')
        expect(result).to eq(false)
      end

      it 'handles mixed values' do
        result = engine.evaluate('Or(5, 3)')
        expect(result).to eq(true)
      end
    end

    describe 'True function' do
      it 'returns true' do
        result = engine.evaluate('True()')
        expect(result).to eq(true)
      end
    end

    describe 'False function' do
      it 'returns false' do
        result = engine.evaluate('False()')
        expect(result).to eq(false)
      end
    end

    describe 'If function' do
      it 'returns true value when condition is True()' do
        result = engine.evaluate('If(True(), "That\'s true", "That\'s not true")')
        expect(result).to eq("That's true")
      end

      it 'returns false value when condition is False()' do
        result = engine.evaluate('If(False(), "That\'s true", "That\'s not true")')
        expect(result).to eq("That's not true")
      end

      it 'evaluates comparison expressions correctly - greater than true' do
        result = engine.evaluate('If(6 > 5, "6 is more than 5", "That\'s not correct")')
        expect(result).to eq("6 is more than 5")
      end

      it 'evaluates comparison expressions correctly - less than false' do
        result = engine.evaluate('If(6 < 5, "6 is more than 5", "That\'s not correct")')
        expect(result).to eq("That's not correct")
      end

      it 'evaluates equality expressions correctly - false case' do
        result = engine.evaluate('If(6 == 5, "That\'s correct", "That\'s not correct")')
        expect(result).to eq("That's not correct")
      end

      it 'evaluates inequality expressions correctly - true case' do
        result = engine.evaluate('If(6 != 5, "That\'s correct", "That\'s not correct")')
        expect(result).to eq("That's correct")
      end

      it 'works with numeric conditions' do
        result = engine.evaluate('If(1, "truthy", "falsy")')
        expect(result).to eq("truthy")
      end

      it 'works with zero as falsy condition' do
        result = engine.evaluate('If(0, "truthy", "falsy")')
        expect(result).to eq("falsy")
      end
    end

    describe 'IfBlank function' do
      it 'returns default value when text is empty string' do
        result = engine.evaluate('IfBlank("", "Default if blank")')
        expect(result).to eq("Default if blank")
      end

      it 'returns original text when text is not blank' do
        result = engine.evaluate('IfBlank("Hello world", "Default if blank")')
        expect(result).to eq("Hello world")
      end

      it 'handles numeric values' do
        result = engine.evaluate('IfBlank(42, "Default if blank")')
        expect(result).to eq(42)
      end

      it 'handles whitespace as non-blank' do
        result = engine.evaluate('IfBlank(" ", "Default if blank")')
        expect(result).to eq(" ")
      end

      it 'returns original value for non-string values' do
        result = engine.evaluate('IfBlank(0, "Default if blank")')
        expect(result).to eq(0.0)
      end
    end

    describe 'Not function' do
      it 'returns false when given True()' do
        result = engine.evaluate('Not(True())')
        expect(result).to eq(false)
      end

      it 'returns true when given False()' do
        result = engine.evaluate('Not(False())')
        expect(result).to eq(true)
      end

      it 'returns false for truthy values' do
        result = engine.evaluate('Not(1)')
        expect(result).to eq(false)
      end

      it 'returns true for falsy values' do
        result = engine.evaluate('Not(0)')
        expect(result).to eq(true)
      end

      it 'handles complex expressions' do
        result = engine.evaluate('Not(5 > 10)')
        expect(result).to eq(true)
      end

      it 'handles string values' do
        result = engine.evaluate('Not("hello")')
        expect(result).to eq(false)
      end

      it 'handles empty string as falsy' do
        result = engine.evaluate('Not("")')
        expect(result).to eq(true)
      end
    end
  end
end