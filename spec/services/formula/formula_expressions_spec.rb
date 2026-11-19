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

    it 'evaluates equals correctly' do
      result = engine.evaluate('3 == 5')
      expect(result).to eq(false)

      result = engine.evaluate('5 == 5')
      expect(result).to eq(true)

      result = engine.evaluate('Number(3) == Number(5)')
      expect(result).to eq(false)

      result = engine.evaluate('Number("5") == Number(5)')
      expect(result).to eq(true)

      result = engine.evaluate('Number("5") == [ThisRow]', context: {ThisRow: 5})
      expect(result).to eq(true)

      result = engine.evaluate('CurrentValue == 5', current_value: 5)
      expect(result).to eq(true)
    end

    it 'evaluates not equals correctly' do
      result = engine.evaluate('3 != 5')
      expect(result).to eq(true)

      result = engine.evaluate('5 != 5')
      expect(result).to eq(false)

      result = engine.evaluate('Number(3) != Number(5)')
      expect(result).to eq(true)

      result = engine.evaluate('Number("5") != Number(5)')
      expect(result).to eq(false)

      result = engine.evaluate('Number("5") != [ThisRow]', context: {ThisRow: 5})
      expect(result).to eq(false)

      result = engine.evaluate('CurrentValue != 5', current_value: 5)
      expect(result).to eq(false)
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

  describe "strict operators" do
    def evaluate(formula, **options)
      engine.evaluate(formula, **options)
    end

    it "compares string literals on either side of an operator" do
      expect(evaluate('"abc" == "abc"')).to be(true)
      expect(evaluate('"5" == "5"')).to be(true)
      expect(evaluate('"5" == "6"')).to be(false)
      expect(evaluate('"a" != "b"')).to be(true)
      expect(evaluate('"b" > "a"')).to be(true)
      expect(evaluate('CurrentValue == "5"', current_value: "5")).to be(true)
    end

    it "orders text as text and case-sensitively" do
      expect(evaluate('"10" > "9"')).to be(false)
      expect(evaluate('"a" > "A"')).to be(true)
      expect(evaluate('"a" == "A"')).to be(false)
    end

    it "never equates values of different kinds" do
      expect(evaluate('"1" == 1')).to be(false)
      expect(evaluate('1 == "1"')).to be(false)
      expect(evaluate('"1" != 1')).to be(true)
      expect(evaluate("True() == 1")).to be(false)
      expect(evaluate('True() == "true"')).to be(false)
      expect(evaluate('Equals("5", 5)')).to be(false)
    end

    it "treats whole and fractional numbers alike" do
      expect(evaluate('Number("5") == 5')).to be(true)
      expect(evaluate('Equals(Number("5"), 5)')).to be(true)
      expect(evaluate('Round(2.4) == 2')).to be(true)
    end

    it "compares lists element by element with the same rules" do
      expect(evaluate("List(1, 2) == List(1, 2)")).to be(true)
      expect(evaluate("List(1, 2) == List(2, 1)")).to be(false)
      expect(evaluate('List(1, 2) == List("1", "2")')).to be(false)
      expect(evaluate('List(1, 2) == ForEach(List("1", "2"), Number(CurrentValue))')).to be(true)
      expect(evaluate('ForEach(List(1, 2), Concatenate(CurrentValue)) == List("1", "2")')).to be(true)
    end

    it "gives == and Equals the same answer" do
      [["1", "1"], ["1", "1.0"], ["1", '"1"'], ['"a"', '"A"'], ["True()", "1"], ["List(1)", 'List("1")']].each do |left, right|
        expect(evaluate("#{left} == #{right}")).to eq(evaluate("Equals(#{left}, #{right})")), "#{left} vs #{right}"
      end
    end

    it "reports ordering across kinds" do
      expect { evaluate('"10" > 9') }.to raise_error(RuntimeError, "Cannot compare Text with Number")
      expect { evaluate('9 < "10"') }.to raise_error(RuntimeError, "Cannot compare Number with Text")
      expect { evaluate("True() > 1") }.to raise_error(RuntimeError, "Cannot compare Boolean with Number")
    end

    it "orders values of the same kind" do
      expect(evaluate("True() > False()")).to be(true)
      expect(evaluate("2 >= 2")).to be(true)
    end

    it "reports arithmetic across kinds" do
      expect { evaluate('"5" + 1') }.to raise_error(RuntimeError, "Cannot add Text and Number")
      expect { evaluate('1 + "5"') }.to raise_error(RuntimeError, "Cannot add Number and Text")
      expect { evaluate('"abc" - 1') }.to raise_error(RuntimeError, "Cannot subtract Text and Number")
      expect { evaluate('"abc" * 2') }.to raise_error(RuntimeError, "Cannot multiply Text and Number")
      expect { evaluate('"abc" / 2') }.to raise_error(RuntimeError, "Cannot divide Text and Number")
      expect { evaluate("True() + 1") }.to raise_error(RuntimeError, "Cannot add Boolean and Number")
    end

    it "still joins text with +" do
      expect(evaluate('"a" + "b"')).to eq("ab")
    end

    it "keeps operator precedence and associativity" do
      expect(evaluate("2 + 3 * 4")).to eq(14)
      expect(evaluate("(2 + 3) * 4")).to eq(20)
      expect(evaluate("10 - 4 - 3")).to eq(3)
      expect(evaluate("2 * 3 + 4 * 5")).to eq(26)
      expect(evaluate("1 + 2 == 3")).to be(true)
      expect(evaluate("8 / 4 / 2")).to eq(1)
      expect(evaluate("Max(1 + 1, 2 * 3) - 1")).to eq(5)
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