require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'collection functions' do
    describe 'Find function' do
      it 'finds text in string' do
        result = engine.evaluate('Find("world", "hello world")')
        expect(result).to eq(true)
      end

      it 'returns false when text not found in string' do
        result = engine.evaluate('Find("world", "hello")')
        expect(result).to eq(false)
      end

      it 'finds item in array' do
        result = engine.evaluate('Find(2, List(1, 2, 3))')
        expect(result).to eq(true)
      end

      it 'returns false when item not found in array' do
        result = engine.evaluate('Find(5, List(1, 2, 3))')
        expect(result).to eq(false)
      end
    end

    describe 'IndexOf function' do
      it 'finds index of text in string' do
        result = engine.evaluate('IndexOf("world", "hello world")')
        expect(result).to eq(6)
      end

      it 'returns -1 when text not found in string' do
        result = engine.evaluate('IndexOf("xyz", "hello world")')
        expect(result).to eq(-1)
      end

      it 'finds index of item in array' do
        result = engine.evaluate('IndexOf(1, List(3, 2, 1))')
        expect(result).to eq(2)
      end

      it 'returns -1 when item not found in array' do
        result = engine.evaluate('IndexOf(1, List(3, 2))')
        expect(result).to eq(-1)
      end
    end

    describe 'List function' do
      it 'creates list from multiple arguments' do
        result = engine.evaluate('List(1, 2, 3, 3, 3, 4)')
        expect(result).to eq([1.0, 2.0, 3.0, 3.0, 3.0, 4.0])
      end

      it 'creates list from single argument' do
        result = engine.evaluate('List(42)')
        expect(result).to eq([42.0])
      end

      it 'creates empty list with no arguments' do
        result = engine.evaluate('List()')
        expect(result).to eq([])
      end
    end

    describe 'Unique function' do
      it 'returns unique elements from array' do
        result = engine.evaluate('Unique(List(1, 2, 3, 3, 3, 4))')
        expect(result).to eq([1.0, 2.0, 3.0, 4.0])
      end

      it 'works with string elements' do
        result = engine.evaluate('Unique(List("a", "b", "a", "c"))')
        expect(result).to eq(["a", "b", "c"])
      end
    end

    describe 'CountUnique function' do
      it 'counts unique numeric elements' do
        result = engine.evaluate('CountUnique(List(1, 2, 3, 3, 3, 4))')
        expect(result).to eq(4)
      end

      it 'counts unique elements when all are unique' do
        result = engine.evaluate('CountUnique(List(1, 2, 3, 4))')
        expect(result).to eq(4)
      end

      it 'counts unique elements with duplicates' do
        result = engine.evaluate('CountUnique(List(1, 1, 2, 2))')
        expect(result).to eq(2)
      end

      it 'counts unique string elements' do
        result = engine.evaluate('CountUnique(List("world", "world", "hello"))')
        expect(result).to eq(2)
      end
    end

    describe 'Sum function' do
      it 'sums array elements' do
        result = engine.evaluate('Sum(List(1, 2, 3, 4))')
        expect(result).to eq(10.0)
      end

      it 'sums multiple direct arguments' do
        result = engine.evaluate('Sum(1, 2, 3, 4)')
        expect(result).to eq(10.0)
      end

      it 'handles empty array' do
        result = engine.evaluate('Sum(List())')
        expect(result).to eq(0)
      end
    end

    describe 'First function' do
      it 'returns first element of array' do
        result = engine.evaluate('First(List(1, 2, 3, 3, 3, 4))')
        expect(result).to eq(1.0)
      end

      it 'returns first element of single-item array' do
        result = engine.evaluate('First(List(1))')
        expect(result).to eq(1.0)
      end

      it 'returns nil for empty array' do
        result = engine.evaluate('First(List())')
        expect(result).to eq(nil)
      end
    end

    describe 'Last function' do
      it 'returns last element of array' do
        result = engine.evaluate('Last(List(1, 2, 3, 3, 3, 4))')
        expect(result).to eq(4.0)
      end

      it 'returns last element of single-item array' do
        result = engine.evaluate('Last(List(1))')
        expect(result).to eq(1.0)
      end

      it 'returns nil for empty array' do
        result = engine.evaluate('Last(List())')
        expect(result).to eq(nil)
      end
    end

    describe 'Nth function' do
      it 'returns nth element (1-based indexing)' do
        result = engine.evaluate('Nth(List(1, 2, 3, 3, 3, 4), 2)')
        expect(result).to eq(2.0)
      end

      it 'returns first element when index is 1' do
        result = engine.evaluate('Nth(List(1), 1)')
        expect(result).to eq(1.0)
      end

      it 'returns nil when index is out of bounds' do
        result = engine.evaluate('Nth(List(1), 10)')
        expect(result).to eq(nil)
      end

      it 'returns nil when index is 0 or negative' do
        result = engine.evaluate('Nth(List(1, 2, 3), 0)')
        expect(result).to eq(nil)
      end
    end

    describe 'Splice function' do
      it 'removes all elements from start index when no delete count specified' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), 0)')
        expect(result).to eq([])
      end

      it 'returns original array when delete count is 0' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), 0, 0)')
        expect(result).to eq([1.0, 2.0, 3.0, 4.0, 5.0])
      end

      it 'removes last element when start index is -1' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), -1)')
        expect(result).to eq([1.0, 2.0, 3.0, 4.0])
      end

      it 'removes last element using Number function for negative index' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), Number("-1"))')
        expect(result).to eq([1.0, 2.0, 3.0, 4.0])
      end

      it 'removes specified number of elements' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), 2, 2)')
        expect(result).to eq([1.0, 2.0, 5.0])
      end

      it 'removes elements and inserts new ones' do
        result = engine.evaluate('Splice(List(1, 2, 3, 4, 5), 2, 2, 6, 7)')
        expect(result).to eq([1.0, 2.0, 6.0, 7.0, 5.0])
      end
    end

    describe 'Filter function' do
      it 'filters elements based on condition' do
        result = engine.evaluate('Filter(List(1, 2, 3, 3, 3, 4), "CurrentValue >= 3")')
        expect(result).to eq([3.0, 3.0, 3.0, 4.0])
      end

      it 'filters elements based on not equals condition' do
        result = engine.evaluate('Filter(List(1, 2, 3, 3, 3, 4), "CurrentValue != 3")')
        expect(result).to eq([1.0, 2.0, 4.0])
      end

      it 'filters elements with variable reference' do
        result = engine.evaluate('Filter(List(1, 2, 3, 3, 3, 4), "CurrentValue != [ThisValue]")', context: {ThisValue: 3})
        expect(result).to eq([1.0, 2.0, 4.0])
      end
    end

    describe 'ForEach function' do
      it 'applies function to each element' do
        result = engine.evaluate('ForEach(List("Dog", "Cat"), "Upper(CurrentValue)")')
        expect(result).to eq(["DOG", "CAT"])
      end
    end

    describe 'All function' do
      it 'returns false when not all elements match condition' do
        result = engine.evaluate('All(List(1, 2, 3, 3, 3, 4), "CurrentValue >= 3")')
        expect(result).to eq(false)
      end

      it 'returns true when all elements match condition' do
        result = engine.evaluate('All(List(1, 2, 3, 3, 3, 4), "CurrentValue >= 0")')
        expect(result).to eq(true)
      end
    end

    describe 'Any function' do
      it 'returns false when no elements match condition' do
        result = engine.evaluate('Any(List(1, 2, 3, 3, 3, 4), "CurrentValue < 0")')
        expect(result).to eq(false)
      end

      it 'returns true when some elements match condition' do
        result = engine.evaluate('Any(List(1, 2, 3, 3, 3, 4), "CurrentValue >= 3")')
        expect(result).to eq(true)
      end
    end
  end
end