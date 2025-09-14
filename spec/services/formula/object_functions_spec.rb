require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'object functions' do
    describe 'Dig function' do
      it 'gets different fields from an object' do
        # Read the metabase webhook JSON fixture file (matching original NextJS test)
        json_content = File.read(Rails.root.join('spec/fixtures/files/formula/metabase-webhook.json'))
        
        # Use Dig to extract nested data from the JSON (replicating the exact NextJS test)
        result = engine.evaluate("Dig(ParseJSON(#{json_content.to_json}), \"data\", \"raw_data\", \"cols\")")
        expected = ["week_start", "sum"]
        expect(result).to eq(expected)
      end

      it 'returns nil for non-existent paths' do
        result = engine.evaluate('Dig(ParseJSON("{\"a\": {\"b\": \"value\"}}"), "a", "nonexistent")')
        expect(result).to be_nil
      end

      it 'returns the object itself when no path is provided' do
        result = engine.evaluate('Dig(ParseJSON("{\"key\": \"value\"}"))')
        expected = {"key" => "value"}
        expect(result).to eq(expected)
      end

      it 'works with single level access' do
        result = engine.evaluate('Dig(ParseJSON("{\"name\": \"test\"}"), "name")')
        expect(result).to eq("test")
      end

      it 'works with arrays' do
        result = engine.evaluate('Dig(ParseJSON("{\"items\": [\"a\", \"b\", \"c\"]}"), "items")')
        expect(result).to eq(["a", "b", "c"])
      end
    end

    describe 'Equals function' do
      it 'returns true for equal numbers' do
        result = engine.evaluate('Equals(2, 1+1)')
        expect(result).to be true
      end

      it 'returns false for different values' do
        result = engine.evaluate('Equals(2, True())')
        expect(result).to be false
      end

      it 'returns true for equal strings' do
        result = engine.evaluate('Equals("hello", "hello")')
        expect(result).to be true
      end

      it 'returns false for different strings' do
        result = engine.evaluate('Equals("hello", "world")')
        expect(result).to be false
      end

      it 'performs deep equality check on objects' do
        result = engine.evaluate('Equals(ParseJSON("{\"a\": 1}"), ParseJSON("{\"a\": 1}"))')
        expect(result).to be true
      end

      it 'returns false for different objects' do
        result = engine.evaluate('Equals(ParseJSON("{\"a\": 1}"), ParseJSON("{\"a\": 2}"))')
        expect(result).to be false
      end

      it 'performs deep equality check on arrays' do
        result = engine.evaluate('Equals(List(1, 2, 3), List(1, 2, 3))')
        expect(result).to be true
      end

      it 'returns false for different arrays' do
        result = engine.evaluate('Equals(List(1, 2, 3), List(1, 2, 4))')
        expect(result).to be false
      end

      it 'handles nested structures' do
        result = engine.evaluate('Equals(ParseJSON("{\"a\": {\"b\": [1, 2]}}"), ParseJSON("{\"a\": {\"b\": [1, 2]}}"))')
        expect(result).to be true
      end

      it 'returns false for nested structures with differences' do
        result = engine.evaluate('Equals(ParseJSON("{\"a\": {\"b\": [1, 2]}}"), ParseJSON("{\"a\": {\"b\": [1, 3]}}"))')
        expect(result).to be false
      end
    end
  end
end