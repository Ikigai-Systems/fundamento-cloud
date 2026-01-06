# This file is called when a cypress spec fails and allows for extra logging to be captured
filename = command_options.fetch('runnable_full_title', 'no title').gsub(/[^[:print:]]/, '')

# grab last lines until "APPCLEANED" (Make sure in clean.rb to log the text "APPCLEANED")
# system "tail -n 10000 -r log/#{Rails.env}.log | sed \"/APPCLEANED/ q\" | sed 'x;1!H;$!d;x' > 'log/cypress/#{filename}.log'"
# Alternative command if the above does not work
system "tail -n 10000 log/#{Rails.env}.log | tac | sed \"/APPCLEANED/ q\" | sed 'x;1!H;$!d;x' > 'log/cypress/#{filename}.log'"

# Helper lambda to recursively encode all strings to UTF-8
encode_to_utf8 = ->(obj) do
  case obj
  when String
    # Convert to UTF-8, replacing invalid sequences
    obj.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
  when Hash
    obj.transform_values { |v| encode_to_utf8.call(v) }
  when Array
    obj.map { |v| encode_to_utf8.call(v) }
  else
    obj
  end
end

# create a json debug file for server debugging
json_result = {}
json_result['error'] = command_options.fetch('error_message', 'no error message')

if defined?(ActiveRecord::Base)
  json_result['records'] =
    ActiveRecord::Base.descendants.each_with_object({}) do |record_class, records|
      begin
        records[record_class.to_s] = record_class.limit(100).map(&:attributes)
      rescue
      end
    end
end

# Ensure all strings are properly encoded to UTF-8
json_result = encode_to_utf8.call(json_result)

filename = command_options.fetch('runnable_full_title', 'no title').gsub(/[^[:print:]]/, '')
File.open("#{Rails.root}/log/cypress/#{filename}.json", "w+") do |file|
  file << JSON.pretty_generate(json_result)
end
