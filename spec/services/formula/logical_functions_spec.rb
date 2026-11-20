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

    describe "ToBoolean function" do
      {
        "True()" => true, "False()" => false, "1" => true, "0" => false,
        '"true"' => true, '"True"' => true, '"TRUE"' => true, '"false"' => false, '"False"' => false,
        '"t"' => true, '"T"' => true, '"f"' => false, '"F"' => false, '" true "' => true
      }.each do |argument, expected|
        it "turns #{argument} into #{expected}" do
          expect(engine.evaluate("ToBoolean(#{argument})")).to be(expected)
        end
      end

      ['2', '-1', '0.5', '"yes"', '"no"', '"1"', '"0"', '""', 'List(1)', 'Date(2024, 1, 1)'].each do |argument|
        it "rejects #{argument}" do
          expect { engine.evaluate("ToBoolean(#{argument})") }.to raise_error(ArgumentError, /Cannot convert .* to true or false/)
        end
      end

      it "rejects a blank value and names it" do
        expect { engine.evaluate("ToBoolean(CurrentValue)", current_value: nil) }.to raise_error(ArgumentError, "Cannot convert Blank to true or false")
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

    describe 'blank values' do
      let(:row) { { "currentRow" => { "Empty" => nil, "Qty" => 0 } } }

      it 'treats an empty cell, empty text and an empty list as blank' do
        expect(engine.evaluate('IfBlank(CurrentRow("Empty"), "none")', context: row)).to eq("none")
        expect(engine.evaluate('IfBlank(List(), "none")')).to eq("none")
        expect(engine.evaluate('IsBlank(CurrentRow("Empty"))', context: row)).to eq(true)
        expect(engine.evaluate('IsBlank("")')).to eq(true)
        expect(engine.evaluate('IsBlank(List())')).to eq(true)
      end

      it 'treats 0, false and a space as values' do
        expect(engine.evaluate('IsBlank(CurrentRow("Qty"))', context: row)).to eq(false)
        expect(engine.evaluate('IsBlank(False())')).to eq(false)
        expect(engine.evaluate('IsBlank(" ")')).to eq(false)
        expect(engine.evaluate('IfBlank(CurrentRow("Qty"), 5)', context: row)).to eq(0)
      end

      it 'has IsNotBlank as the opposite' do
        expect(engine.evaluate('IsNotBlank("x")')).to eq(true)
        expect(engine.evaluate('IsNotBlank(CurrentRow("Empty"))', context: row)).to eq(false)
        expect(engine.evaluate('IsNotBlank(List(1))')).to eq(true)
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
    describe 'what counts as true' do
      false_values = ['0', '0.0', '""']
      true_values = ['1', '-2', '" "', '"0"', '"abc"', '"false"', '"False"', 'Days(0)']

      false_values.each do |value|
        it "treats #{value} as false in If, Not, And, Or and Filter" do
          expect(engine.evaluate("If(#{value}, 1, 2)")).to eq(2)
          expect(engine.evaluate("Not(#{value})")).to eq(true)
          expect(engine.evaluate("And(#{value}, True())")).to eq(false)
          expect(engine.evaluate("Or(#{value}, False())")).to eq(false)
          expect(engine.evaluate("Filter(List(#{value}), \"CurrentValue\")")).to eq([])
        end
      end

      true_values.each do |value|
        it "treats #{value} as true in If, Not, And, Or and Filter" do
          expect(engine.evaluate("If(#{value}, 1, 2)")).to eq(1)
          expect(engine.evaluate("Not(#{value})")).to eq(false)
          expect(engine.evaluate("And(#{value}, True())")).to eq(true)
          expect(engine.evaluate("Or(#{value}, False())")).to eq(true)
          expect(engine.evaluate("Filter(List(#{value}), \"CurrentValue\")").size).to eq(1)
        end
      end

      it 'treats All and Any like If' do
        expect(engine.evaluate('All(List(1, 0), "CurrentValue")')).to eq(false)
        expect(engine.evaluate('Any(List(0, ""), "CurrentValue")')).to eq(false)
        expect(engine.evaluate('Any(List(0, "a"), "CurrentValue")')).to eq(true)
      end

      it 'reads the flags of ContainsText, StartsWith and EndsWith the same way' do
        expect(engine.evaluate('ContainsText("Hello", "hello", 1)')).to eq(true)
        expect(engine.evaluate('StartsWith("Hello", "hello", 0)')).to eq(false)
        expect(engine.evaluate('EndsWith("Hello", "LLO", "x")')).to eq(true)
      end

      it 'refuses a list or an object as a condition' do
        expect { engine.evaluate('If(List(), 1, 2)') }.to raise_error("If needs a value that is true or false, but got List")
        expect { engine.evaluate('Not(List(1))') }.to raise_error("Not needs a value that is true or false, but got List")
      end
    end
  end
end