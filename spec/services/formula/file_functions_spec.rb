require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }

  describe 'file functions' do
    describe 'ParseJSON function' do
      it 'parses simple JSON object' do
        json_string = '{\"Name\": \"Jira\", \"Key\": \"JIRA\"}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {"Name" => "Jira", "Key" => "JIRA"}
        expect(result).to eq(expected)
      end

      it 'parses JSON array' do
        json_string = '[\"apple\", \"banana\", \"cherry\"]'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = ["apple", "banana", "cherry"]
        expect(result).to eq(expected)
      end

      it 'parses nested JSON object' do
        json_string = '{\"user\": {\"name\": \"John\", \"age\": 30}, \"active\": true}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {"user" => {"name" => "John", "age" => 30}, "active" => true}
        expect(result).to eq(expected)
      end

      it 'parses JSON with numbers' do
        json_string = '{\"count\": 42, \"price\": 19.99, \"negative\": -5}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {"count" => 42, "price" => 19.99, "negative" => -5}
        expect(result).to eq(expected)
      end

      it 'parses JSON with boolean values' do
        json_string = '{\"enabled\": true, \"visible\": false}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {"enabled" => true, "visible" => false}
        expect(result).to eq(expected)
      end

      it 'parses JSON with null values' do
        json_string = '{\"data\": null, \"message\": \"success\"}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {"data" => nil, "message" => "success"}
        expect(result).to eq(expected)
      end

      it 'parses empty JSON object' do
        json_string = '{}'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = {}
        expect(result).to eq(expected)
      end

      it 'parses empty JSON array' do
        json_string = '[]'
        result = engine.evaluate("ParseJSON(\"#{json_string}\")")
        expected = []
        expect(result).to eq(expected)
      end

      it 'matches NextJS test case exactly' do
        result = engine.evaluate('ParseJSON("{\\"Name\\": \\"Jira\\", \\"Key\\": \\"JIRA\\"}")')
        expected = {"Name" => "Jira", "Key" => "JIRA"}
        expect(result).to eq(expected)
      end

      it 'handles numeric input by converting to string first' do
        result = engine.evaluate('ParseJSON("123")')
        expect(result).to eq(123)
      end
    end
  end
end