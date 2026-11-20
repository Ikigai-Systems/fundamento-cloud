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

      it 'refuses numbers' do
        expect { engine.evaluate('And(1, 2)') }.to raise_error("And needs true or false, but got Number")
      end

      it 'refuses text' do
        expect { engine.evaluate('And(True(), "yes")') }.to raise_error("And needs true or false, but got Text")
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

      it 'refuses numbers' do
        expect { engine.evaluate('Or(1, 0)') }.to raise_error("Or needs true or false, but got Number")
      end

      it 'refuses text' do
        expect { engine.evaluate('Or(False(), "yes")') }.to raise_error("Or needs true or false, but got Text")
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

      it 'refuses a number as the condition' do
        expect { engine.evaluate('If(1, "yes", "no")') }.to raise_error("If needs true or false, but got Number")
        expect { engine.evaluate('If(0, "yes", "no")') }.to raise_error("If needs true or false, but got Number")
      end

      it 'refuses text as the condition, even the text "false"' do
        expect { engine.evaluate('If("false", "yes", "no")') }.to raise_error("If needs true or false, but got Text")
      end

      it 'accepts ToBoolean of a checkbox text' do
        expect(engine.evaluate('If(ToBoolean("t"), "yes", "no")')).to eq("yes")
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

      it 'refuses numbers' do
        expect { engine.evaluate('Not(1)') }.to raise_error("Not needs true or false, but got Number")
      end

      it 'handles complex expressions' do
        result = engine.evaluate('Not(5 > 10)')
        expect(result).to eq(true)
      end

      it 'refuses text' do
        expect { engine.evaluate('Not("hello")') }.to raise_error("Not needs true or false, but got Text")
      end

      it 'refuses empty text' do
        expect { engine.evaluate('Not("")') }.to raise_error("Not needs true or false, but got Text")
      end
    end
  end
end