require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'default functions' do
    describe 'Max function' do
      it 'returns the maximum of two positive numbers' do
        result = engine.evaluate('Max(10, 20)')
        expect(result).to eq(20)
      end

      it 'returns the maximum of two negative numbers' do
        result = engine.evaluate('Max(-10, -5)')
        expect(result).to eq(-5)
      end

      it 'returns the maximum when one number is negative and one positive' do
        result = engine.evaluate('Max(-10, 5)')
        expect(result).to eq(5)
      end

      it 'returns the same number when both are equal' do
        result = engine.evaluate('Max(7, 7)')
        expect(result).to eq(7)
      end

      it 'works with decimal numbers' do
        result = engine.evaluate('Max(3.14, 2.71)')
        expect(result).to eq(3.14)
      end
    end

    describe 'Min function' do
      it 'returns the minimum of two positive numbers' do
        result = engine.evaluate('Min(10, 20)')
        expect(result).to eq(10)
      end

      it 'returns the minimum of two negative numbers' do
        result = engine.evaluate('Min(-10, -5)')
        expect(result).to eq(-10)
      end

      it 'returns the minimum when one number is negative and one positive' do
        result = engine.evaluate('Min(-10, 5)')
        expect(result).to eq(-10)
      end

      it 'returns the same number when both are equal' do
        result = engine.evaluate('Min(7, 7)')
        expect(result).to eq(7)
      end

      it 'works with decimal numbers' do
        result = engine.evaluate('Min(3.14, 2.71)')
        expect(result).to eq(2.71)
      end
    end

    describe 'Abs function' do
      it 'returns the absolute value of a positive number' do
        result = engine.evaluate('Abs(42)')
        expect(result).to eq(42)
      end

      it 'returns the absolute value of a negative number' do
        result = engine.evaluate('Abs(-42)')
        expect(result).to eq(42)
      end

      it 'returns zero for zero' do
        result = engine.evaluate('Abs(0)')
        expect(result).to eq(0)
      end

      it 'works with decimal numbers' do
        result = engine.evaluate('Abs(-3.14)')
        expect(result).to eq(3.14)
      end
    end

    describe 'Round function' do
      it 'rounds a number to the nearest integer by default' do
        result = engine.evaluate('Round(3.7)')
        expect(result).to eq(4)
      end

      it 'rounds down when decimal is less than 0.5' do
        result = engine.evaluate('Round(3.4)')
        expect(result).to eq(3)
      end

      it 'rounds to specified decimal places' do
        result = engine.evaluate('Round(3.14159, 2)')
        expect(result).to eq(3.14)
      end

      it 'handles zero decimal places explicitly' do
        result = engine.evaluate('Round(3.7, 0)')
        expect(result).to eq(4)
      end

      it 'works with negative numbers' do
        result = engine.evaluate('Round(-3.7)')
        expect(result).to eq(-4)
      end

      it 'rounds to multiple decimal places' do
        result = engine.evaluate('Round(123.456789, 4)')
        expect(result).to eq(123.4568)
      end
    end

    describe 'If function' do
      it 'returns true value when condition is true' do
        result = engine.evaluate('If(5 > 3, "yes", "no")')
        expect(result).to eq("yes")
      end

      it 'returns false value when condition is false' do
        result = engine.evaluate('If(5 < 3, "yes", "no")')
        expect(result).to eq("no")
      end

      it 'works with numeric return values' do
        result = engine.evaluate('If(10 == 10, 42, 0)')
        expect(result).to eq(42)
      end

      it 'evaluates complex conditions' do
        result = engine.evaluate('If(Max(5, 10) > 8, 100, 200)')
        expect(result).to eq(100)
      end

      it 'works with equality comparisons' do
        result = engine.evaluate('If(7 == 7, "equal", "not equal")')
        expect(result).to eq("equal")
      end

      it 'works with inequality comparisons' do
        result = engine.evaluate('If(7 != 8, "different", "same")')
        expect(result).to eq("different")
      end
    end

    describe 'Sum function' do
      it 'sums two numbers' do
        result = engine.evaluate('Sum(5, 10)')
        expect(result).to eq(15)
      end

      it 'sums multiple numbers' do
        result = engine.evaluate('Sum(1, 2, 3, 4, 5)')
        expect(result).to eq(15)
      end

      it 'sums decimal numbers' do
        result = engine.evaluate('Sum(1.5, 2.5, 3.0)')
        expect(result).to eq(7.0)
      end

      it 'sums negative numbers' do
        result = engine.evaluate('Sum(-5, 10, -3)')
        expect(result).to eq(2)
      end

      it 'returns zero for no arguments' do
        result = engine.evaluate('Sum()')
        expect(result).to eq(0)
      end

      it 'returns the single number when only one argument' do
        result = engine.evaluate('Sum(42)')
        expect(result).to eq(42)
      end
    end

    describe 'Average function' do
      it 'calculates average of two numbers' do
        result = engine.evaluate('Average(10, 20)')
        expect(result).to eq(15.0)
      end

      it 'calculates average of multiple numbers' do
        result = engine.evaluate('Average(1, 2, 3, 4, 5)')
        expect(result).to eq(3.0)
      end

      it 'calculates average of decimal numbers' do
        result = engine.evaluate('Average(1.5, 2.5)')
        expect(result).to eq(2.0)
      end

      it 'calculates average including negative numbers' do
        result = engine.evaluate('Average(-10, 0, 10)')
        expect(result).to eq(0.0)
      end

      it 'returns the single number when only one argument' do
        result = engine.evaluate('Average(42)')
        expect(result).to eq(42.0)
      end

      it 'handles fractional results' do
        result = engine.evaluate('Average(1, 2)')
        expect(result).to eq(1.5)
      end
    end

    describe 'Sqrt function' do
      it 'calculates square root of perfect squares' do
        result = engine.evaluate('Sqrt(16)')
        expect(result).to eq(4.0)
      end

      it 'calculates square root of non-perfect squares' do
        result = engine.evaluate('Sqrt(2)')
        expect(result).to be_within(0.001).of(1.414)
      end

      it 'calculates square root of zero' do
        result = engine.evaluate('Sqrt(0)')
        expect(result).to eq(0.0)
      end

      it 'calculates square root of decimal numbers' do
        result = engine.evaluate('Sqrt(6.25)')
        expect(result).to eq(2.5)
      end

      it 'raises error for negative numbers' do
        expect { engine.evaluate('Sqrt(-4)') }.to raise_error(Math::DomainError)
      end
    end

    describe 'Power function' do
      it 'calculates integer powers' do
        result = engine.evaluate('Power(2, 3)')
        expect(result).to eq(8)
      end

      it 'calculates power of zero' do
        result = engine.evaluate('Power(5, 0)')
        expect(result).to eq(1)
      end

      it 'calculates power of one' do
        result = engine.evaluate('Power(7, 1)')
        expect(result).to eq(7)
      end

      it 'calculates negative powers' do
        result = engine.evaluate('Power(2, -2)')
        expect(result).to eq(0.25)
      end

      it 'calculates decimal powers' do
        result = engine.evaluate('Power(4, 0.5)')
        expect(result).to eq(2.0)
      end

      it 'calculates decimal base with integer power' do
        result = engine.evaluate('Power(1.5, 2)')
        expect(result).to eq(2.25)
      end
    end

    describe 'Log function' do
      it 'calculates natural logarithm by default' do
        result = engine.evaluate('Log(2.718281828)')
        expect(result).to be_within(0.001).of(1.0)
      end

      it 'calculates logarithm with specified base' do
        result = engine.evaluate('Log(8, 2)')
        expect(result).to eq(3.0)
      end

      it 'calculates common logarithm (base 10)' do
        result = engine.evaluate('Log(100, 10)')
        expect(result).to eq(2.0)
      end

      it 'calculates logarithm of 1' do
        result = engine.evaluate('Log(1)')
        expect(result).to eq(0.0)
      end

      it 'raises error for non-positive numbers' do
        expect { engine.evaluate('Log(0)') }.to raise_error(Math::DomainError)
        expect { engine.evaluate('Log(-5)') }.to raise_error(Math::DomainError)
      end

      it 'raises error for invalid base' do
        expect { engine.evaluate('Log(10, 0)') }.to raise_error(Math::DomainError)
        expect { engine.evaluate('Log(10, 1)') }.to raise_error(Math::DomainError)
      end
    end

    describe 'nested function calls' do
      it 'evaluates nested Max and Min functions' do
        result = engine.evaluate('Max(Min(10, 5), 7)')
        expect(result).to eq(7)
      end

      it 'evaluates complex nested expressions' do
        result = engine.evaluate('Round(Average(Max(1, 2), Min(8, 9)), 1)')
        expect(result).to eq(5.0)
      end

      it 'evaluates If with function calls in condition and values' do
        result = engine.evaluate('If(Max(3, 7) > 5, Sum(1, 2, 3), Average(4, 6))')
        expect(result).to eq(6)
      end

      it 'evaluates mathematical functions together' do
        result = engine.evaluate('Round(Sqrt(Power(3, 2) + Power(4, 2)))')
        expect(result).to eq(5)
      end
    end

    describe 'functions with variables and CurrentValue' do
      let(:context) { { 'X' => 10, 'Y' => 20, 'Rate' => 0.1 } }

      it 'uses variables in Max function' do
        result = engine.evaluate('Max([X], [Y])', context)
        expect(result).to eq(20)
      end

      it 'uses CurrentValue in calculations' do
        result = engine.evaluate('Sum(CurrentValue, 10)', {}, 5)
        expect(result).to eq(15)
      end

      it 'combines variables, CurrentValue, and functions' do
        result = engine.evaluate('If([X] > CurrentValue, Max([X], [Y]), Min([X], [Y]))', context, 15)
        expect(result).to eq(10) # X is not > CurrentValue, so Min(X, Y) = 10
      end

      it 'uses variables in mathematical functions' do
        result = engine.evaluate('Round([X] * [Rate], 2)', context)
        expect(result).to eq(1.0)
      end
    end

    describe 'edge cases and error handling' do
      it 'handles division by zero in expressions used in functions' do
        expect { engine.evaluate('Max(10, 5/0)') }.to raise_error(/Division by zero/)
      end

      it 'raises error for undefined functions' do
        expect { engine.evaluate('UndefinedFunction(5)') }.to raise_error(/Undefined function/)
      end

      it 'raises error when wrong number of arguments' do
        # Note: This depends on your implementation - Ruby's lambda will raise ArgumentError
        expect { engine.evaluate('Max(5)') }.to raise_error(ArgumentError)
        expect { engine.evaluate('Abs(1, 2)') }.to raise_error(ArgumentError)
      end

      it 'handles very large numbers' do
        result = engine.evaluate('Sum(999999999, 1)')
        expect(result).to eq(1000000000)
      end

      it 'handles very small decimal numbers' do
        result = engine.evaluate('Sum(0.0001, 0.0002)')
        expect(result).to be_within(0.000001).of(0.0003)
      end
    end
  end
end