class Formula::DefaultFunctions
  def self.get_functions
    {
      'Max' => ->(a, b) { [a, b].max },
      'Min' => ->(a, b) { [a, b].min },
      'Abs' => ->(x) { x.abs },
      'Round' => ->(x, digits = 0) { x.round(digits.to_i) },
      'If' => ->(condition, true_val, false_val) { Formula::DefaultFunctions.truthy_value?(condition) ? true_val : false_val },
      'Average' => ->(*args) { Formula::Numbers.normalize(Rational(args.map { |arg| Formula::Numbers.exact(arg) }.sum, args.length)) },
      'Sqrt' => ->(x) { Formula::Numbers.exact(Math.sqrt(x)) },
      'Power' => ->(base, exp) { Formula::DefaultFunctions.power(Formula::Numbers.exact(base), Formula::Numbers.exact(exp)) },
      'Log' => ->(x, base = Math::E) { 
        raise Math::DomainError, "Logarithm of non-positive number" if x <= 0
        raise Math::DomainError, "Invalid logarithm base" if base <= 0 || base == 1
        Formula::Numbers.exact(Math.log(x) / Math.log(base))
      },
      
      # Logical functions
      'And' => ->(arg1, arg2) { Formula::DefaultFunctions.truthy_value?(arg1) && Formula::DefaultFunctions.truthy_value?(arg2) },
      'Or' => ->(arg1, arg2) { Formula::DefaultFunctions.truthy_value?(arg1) || Formula::DefaultFunctions.truthy_value?(arg2) },
      'Not' => ->(value) { !Formula::DefaultFunctions.truthy_value?(value) },
      'True' => ->() { true },
      'False' => ->() { false },
      'IfBlank' => ->(text, if_blank) { 
        text == "" ? if_blank : text 
      },
      
      # File functions
      'ParseJSON' => ->(json_string) { 
        JSON.parse(json_string.to_s) 
      },
      
      # String functions
      'Join' => ->(delimiter, *args) { 
        formatted_args = args.flatten.map { |arg| Formula::DefaultFunctions.format_value_for_string(arg) }
        formatted_args.join(delimiter.to_s) 
      },
      'Concatenate' => ->(*args) { 
        formatted_args = args.flatten.map { |arg| Formula::DefaultFunctions.format_value_for_string(arg) }
        formatted_args.join('') 
      },
      'Substring' => ->(text, start_index, end_index = nil) {
        text = text.to_s
        start_pos = start_index.to_i
        if end_index.nil?
          text[start_pos..-1] || ''
        else
          end_pos = end_index.to_i
          text[start_pos...end_pos] || ''
        end
      },
      'ContainsText' => ->(text, search_text, ignore_case = 0, ignore_accents = 0) {
        ignore_case_bool = Formula::DefaultFunctions.truthy_value?(ignore_case)
        ignore_accents_bool = Formula::DefaultFunctions.truthy_value?(ignore_accents)
        normalized_text = Formula::DefaultFunctions.normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_search = Formula::DefaultFunctions.normalize_text(search_text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_text.include?(normalized_search)
      },
      'EndsWith' => ->(text, suffix, ignore_case = 0, ignore_accents = 0) {
        ignore_case_bool = Formula::DefaultFunctions.truthy_value?(ignore_case)
        ignore_accents_bool = Formula::DefaultFunctions.truthy_value?(ignore_accents)
        normalized_text = Formula::DefaultFunctions.normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_suffix = Formula::DefaultFunctions.normalize_text(suffix.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_text.end_with?(normalized_suffix)
      },
      'StartsWith' => ->(text, prefix, ignore_case = 0, ignore_accents = 0) {
        ignore_case_bool = Formula::DefaultFunctions.truthy_value?(ignore_case)
        ignore_accents_bool = Formula::DefaultFunctions.truthy_value?(ignore_accents)
        normalized_text = Formula::DefaultFunctions.normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_prefix = Formula::DefaultFunctions.normalize_text(prefix.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_text.start_with?(normalized_prefix)
      },
      'Substitute' => ->(text, search_for, replacement) {
        text.to_s.sub(search_for.to_s, replacement.to_s)
      },
      'SubstituteAll' => ->(text, search_for, replacement) {
        text.to_s.gsub(search_for.to_s, replacement.to_s)
      },
      'Upper' => ->(text) { text.to_s.upcase },
      'Lower' => ->(text) { text.to_s.downcase },
      'Number' => ->(text) {
        text.is_a?(Numeric) ? Formula::Numbers.exact(text) : (Formula::Numbers.parse(text) || raise(ArgumentError, "Cannot convert '#{text.to_s.strip}' to number"))
      },
      'ToBoolean' => ->(value) { Formula::DefaultFunctions.to_boolean(value) },
      'String' => ->(value) { Formula::DefaultFunctions.format_value_for_string(value) },
      'Split' => ->(text, delimiter = nil) {
        text_str = text.to_s
        if delimiter.nil?
          [text_str]
        elsif delimiter.to_s.empty?
          text_str.chars
        else
          result = text_str.split(delimiter.to_s)
          # Ruby's split returns [] for empty string, but JavaScript returns [""]
          # Match JavaScript behavior for consistency
          result.empty? && text_str.empty? ? [""] : result
        end
      },

      # Collection functions
      'Find' => ->(search_item, collection) {
        if collection.is_a?(String)
          collection.include?(search_item.to_s)
        elsif collection.is_a?(Array)
          collection.include?(search_item)
        else
          false
        end
      },
      'IndexOf' => ->(search_item, collection) {
        if collection.is_a?(String)
          collection.index(search_item.to_s) || -1
        elsif collection.is_a?(Array)
          collection.index(search_item) || -1
        else
          -1
        end
      },
      'List' => ->(*args) { args },
      'Unique' => ->(array) { 
        Array(array).uniq 
      },
      'CountUnique' => ->(*args) { 
        args[0].uniq.length
      },
      'Sum' => ->(*args) { 
        if args.length == 1 && args.first.is_a?(Array)
          args.first.sum
        else
          args.sum
        end
      },
      'First' => ->(array) { 
        Array(array).first 
      },
      'Last' => ->(array) { 
        Array(array).last 
      },
      'Nth' => ->(array, index) {
        arr = Array(array)
        idx = index.to_i - 1  # Convert to 0-based index
        return nil if idx < 0 || idx >= arr.length
        arr[idx]
      },
      'Splice' => ->(array, start_index, delete_count = nil, *items) {
        arr = Array(array).dup
        start_idx = start_index.to_i
        
        if delete_count.nil?
          # If no delete_count, remove everything from start_index
          arr.slice!(start_idx..-1) || []
        else
          delete_cnt = delete_count.to_i
          arr.slice!(start_idx, delete_cnt) || []
          # Insert new items at the same position
          arr.insert(start_idx, *items) unless items.empty?
        end
        
        arr
      },

      # Object functions
      'Dig' => ->(object, *path) {
        return object if path.empty?
        current = object
        path.each do |key|
          if current.respond_to?(:has_key?) && current.has_key?(key.to_s)
            current = current[key.to_s]
          elsif current.respond_to?(:has_key?) && current.has_key?(key.to_sym)
            current = current[key.to_sym]
          else
            return nil
          end
        end
        current
      },
      'Equals' => ->(left, right) {
        # Deep equality check similar to lodash's isEqual
        Formula::DefaultFunctions.deep_equal(left, right)
      },
    }.freeze
  end

  def self.context_functions(context)
    {
      'CurrentRow' => ->(column_name = nil) {
        current_row = context["currentRow"]
        raise "Current row is not available in this context" unless current_row

        if column_name
          if current_row.respond_to?(:has_key?) && current_row.has_key?(column_name.to_s)
            current_row[column_name.to_s]
          elsif current_row.respond_to?(:has_key?) && current_row.has_key?(column_name.to_sym)
            current_row[column_name.to_sym]
          else
            nil
          end
        else
          current_row
        end
      },
    }.freeze
  end

  # Functions that depend on the zone the formula evaluates in (the organization's).
  # The clock is injectable so specs can pin "now"; it returns a Time.
  def self.time_zone_functions(time_zone, clock: nil)
    { "TimeZone" => -> { time_zone } }.merge(Formula::DateTimeFunctions.build(time_zone, clock:)).freeze
  end

  private

  def self.truthy_value?(value)
    return false if value.nil?
    return false if value == 0
    return false if value.to_s.downcase == 'false'
    return false if value.to_s.empty?
    true
  end

  def self.format_value_for_string(value)
    value.is_a?(Numeric) ? Formula::Numbers.to_text(value) : value.to_s
  end

  def self.power(base, exp)
    return Formula::Numbers.normalize(base**exp) if exp.is_a?(Integer)

    Formula::Numbers.exact((base.to_f**exp.to_f))
  end

  def self.normalize_text(text, ignore_case, ignore_accents)
    normalized = text.to_s
    
    if ignore_accents
      # Use Unicode normalization to decompose characters and remove combining marks
      # NFD (Normalization Form Decomposed) separates base characters from accents
      normalized = normalized.unicode_normalize(:nfd)
      # Remove all combining diacritical marks (Unicode category Mn)
      normalized = normalized.gsub(/\p{Mn}/, '')
      # Normalize back to NFC (Normalization Form Composed) for consistency
      normalized = normalized.unicode_normalize(:nfc)
    end
    
    if ignore_case
      normalized = normalized.downcase
    end
    
    normalized
  end

  # Strict conversion: true/false, the text "true"/"false" or "t"/"f" in any case (a checkbox cell
  # is stored as "t"), and the numbers 1 and 0. Anything else is an error.
  def self.to_boolean(value)
    case value
    when true, false then value
    when 1 then true
    when 0 then false
    when String
      case value.strip.downcase
      when "true", "t" then true
      when "false", "f" then false
      else raise ArgumentError, "Cannot convert #{value.inspect} to true or false"
      end
    else
      raise ArgumentError, "Cannot convert #{Formula::TypedArithmetic.type_name(value)} to true or false"
    end
  end

  def self.deep_equal(a, b)
    # Handle nil cases
    return true if a.nil? && b.nil?
    return false if a.nil? || b.nil?
    
    # Handle same object reference
    return true if a.equal?(b)
    
    # Values of different kinds are never equal; 1 and 1.0 are the same kind of value
    return false unless Formula::TypedArithmetic.kind(a) == Formula::TypedArithmetic.kind(b)
    
    # Handle arrays
    if a.is_a?(Array)
      return false unless a.length == b.length
      a.each_with_index do |element, index|
        return false unless deep_equal(element, b[index])
      end
      return true
    end
    
    # Handle hashes
    if a.is_a?(Hash)
      return false unless a.keys.sort == b.keys.sort
      a.each do |key, value|
        return false unless deep_equal(value, b[key])
      end
      return true
    end
    
    # Handle primitives
    return Formula::Numbers.exact(a) == Formula::Numbers.exact(b) if a.is_a?(Numeric)

    a == b
  end
end