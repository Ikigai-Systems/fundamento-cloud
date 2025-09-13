require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'string functions' do
    describe 'Join function' do
      it 'joins strings with delimiter' do
        result = engine.evaluate('Join("-", "This", "is", "Awesome")')
        expect(result).to eq("This-is-Awesome")
      end

      it 'joins strings with comma and space delimiter' do
        result = engine.evaluate('Join(", ", "This", "is", "Awesome")')
        expect(result).to eq("This, is, Awesome")
      end

      it 'joins single string' do
        result = engine.evaluate('Join("-", "This")')
        expect(result).to eq("This")
      end

      it 'handles numeric values' do
        result = engine.evaluate('Join("-", "Number", 123)')
        expect(result).to eq("Number-123")
      end
    end

    describe 'Concatenate function' do
      it 'concatenates strings without delimiter' do
        result = engine.evaluate('Concatenate("This", "Is", "Awesome")')
        expect(result).to eq("ThisIsAwesome")
      end

      it 'handles single string' do
        result = engine.evaluate('Concatenate("Single")')
        expect(result).to eq("Single")
      end

      it 'handles numeric values' do
        result = engine.evaluate('Concatenate("Value", 42)')
        expect(result).to eq("Value42")
      end
    end

    describe 'Substring function' do
      it 'extracts substring with start and end indices' do
        result = engine.evaluate('Substring("This Is Awesome", 5, 7)')
        expect(result).to eq("Is")
      end

      it 'extracts substring from start index to end' do
        result = engine.evaluate('Substring("This Is Awesome", 5)')
        expect(result).to eq("Is Awesome")
      end

      it 'handles out of bounds indices gracefully' do
        result = engine.evaluate('Substring("Short", 10)')
        expect(result).to eq("")
      end

      it 'handles negative indices' do
        result = engine.evaluate('Substring("Hello", -3)')
        expect(result).to eq("llo")
      end
    end

    describe 'ContainsText function' do
      it 'finds text in string' do
        result = engine.evaluate('ContainsText("a needle in the haystack", "needle")')
        expect(result).to eq(true)
      end

      it 'returns false when text not found' do
        result = engine.evaluate('ContainsText("Trippers and askers surround me", "trip")')
        expect(result).to eq(false)
      end

      it 'handles case insensitive search' do
        result = engine.evaluate('ContainsText("But they are not the Me myself", "me", 1)')
        expect(result).to eq(true)
      end

      it 'handles accent insensitive search' do
        result = engine.evaluate('ContainsText("crème fraîche", "creme", 0, 1)')
        expect(result).to eq(true)
      end
    end

    describe 'EndsWith function' do
      it 'returns false when string does not end with suffix' do
        result = engine.evaluate('EndsWith("Hello world", "Find me")')
        expect(result).to eq(false)
      end

      it 'returns true when string ends with suffix' do
        result = engine.evaluate('EndsWith("Hello world", "world")')
        expect(result).to eq(true)
      end

      it 'handles case insensitive check' do
        result = engine.evaluate('EndsWith("Hello World", "world", 1)')
        expect(result).to eq(true)
      end

      it 'handles accent insensitive check' do
        result = engine.evaluate('EndsWith("Hej världen", "varlden", 0, 1)')
        expect(result).to eq(true)
      end
    end

    describe 'StartsWith function' do
      it 'returns false when string does not start with prefix' do
        result = engine.evaluate('StartsWith("Hello world", "Find me")')
        expect(result).to eq(false)
      end

      it 'returns true when string starts with prefix' do
        result = engine.evaluate('StartsWith("Hello world", "Hello")')
        expect(result).to eq(true)
      end

      it 'handles case insensitive check' do
        result = engine.evaluate('StartsWith("Hello World", "hello", 1)')
        expect(result).to eq(true)
      end

      it 'handles accent insensitive check' do
        result = engine.evaluate('StartsWith("Hej världen", "Hej var", 0, 1)')
        expect(result).to eq(true)
      end
    end

    describe 'Substitute function' do
      it 'replaces first occurrence' do
        result = engine.evaluate('Substitute("Hello world", "Hello", "Good morning")')
        expect(result).to eq("Good morning world")
      end

      it 'replaces only first occurrence' do
        result = engine.evaluate('Substitute("ho ho ho", "ho", "yo")')
        expect(result).to eq("yo ho ho")
      end
    end

    describe 'SubstituteAll function' do
      it 'replaces all occurrences' do
        result = engine.evaluate('SubstituteAll("The Cat in the Hat", "at", "orn")')
        expect(result).to eq("The Corn in the Horn")
      end

      it 'replaces all occurrences of repeated pattern' do
        result = engine.evaluate('SubstituteAll("ho ho ho", "ho", "yo")')
        expect(result).to eq("yo yo yo")
      end
    end

    describe 'Upper function' do
      it 'converts text to uppercase' do
        result = engine.evaluate('Upper("hello WORLD")')
        expect(result).to eq("HELLO WORLD")
      end

      it 'handles numbers and special characters' do
        result = engine.evaluate('Upper("test123!@#")')
        expect(result).to eq("TEST123!@#")
      end
    end

    describe 'Lower function' do
      it 'converts text to lowercase' do
        result = engine.evaluate('Lower("hello WORLD")')
        expect(result).to eq("hello world")
      end

      it 'handles numbers and special characters' do
        result = engine.evaluate('Lower("TEST123!@#")')
        expect(result).to eq("test123!@#")
      end
    end

    describe 'Number function' do
      it 'converts numeric string to number' do
        result = engine.evaluate('Number("5")')
        expect(result).to eq(5)
      end

      it 'converts decimal string to number' do
        result = engine.evaluate('Number("3.14")')
        expect(result).to eq(3.14)
      end

      it 'converts negative number string' do
        result = engine.evaluate('Number("-42")')
        expect(result).to eq(-42)
      end

      it 'handles whitespace' do
        result = engine.evaluate('Number("  123  ")')
        expect(result).to eq(123)
      end

      it 'raises error for invalid number format' do
        expect { engine.evaluate('Number("abc")') }.to raise_error(ArgumentError)
      end
    end

    describe 'String function' do
      it 'converts number to string' do
        result = engine.evaluate('String(5)')
        expect(result).to eq("5")
      end

      it 'converts decimal to string' do
        result = engine.evaluate('String(3.14)')
        expect(result).to eq("3.14")
      end

      it 'keeps strings as strings' do
        result = engine.evaluate('String("hello")')
        expect(result).to eq("hello")
      end
    end

    describe 'Split function' do
      it 'splits string by delimiter' do
        result = engine.evaluate('Split("this-is-my-rifle", "-")')
        expect(result).to eq(["this", "is", "my", "rifle"])
      end

      it 'returns array with single string when no delimiter provided' do
        result = engine.evaluate('Split("abcd")')
        expect(result).to eq(["abcd"])
      end

      it 'splits into individual characters when delimiter is empty string' do
        result = engine.evaluate('Split("abcd", "")')
        expect(result).to eq(["a", "b", "c", "d"])
      end

      it 'returns original string in array when delimiter not found' do
        result = engine.evaluate('Split("abcd", ",")')
        expect(result).to eq(["abcd"])
      end

      it 'handles empty string' do
        result = engine.evaluate('Split("", ",")')
        expect(result).to eq([""])
      end
    end
  end
end