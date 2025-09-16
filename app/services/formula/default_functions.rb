class Formula::DefaultFunctions
  def self.get_functions
    {
      'Max' => ->(a, b) { [a, b].max },
      'Min' => ->(a, b) { [a, b].min },
      'Abs' => ->(x) { x.abs },
      'Round' => ->(x, digits = 0) { x.round(digits.to_i) },
      'If' => ->(condition, true_val, false_val) { Formula::DefaultFunctions.truthy_value?(condition) ? true_val : false_val },
      'Average' => ->(*args) { args.sum.to_f / args.length },
      'Sqrt' => ->(x) { Math.sqrt(x) },
      'Power' => ->(base, exp) { base ** exp },
      'Log' => ->(x, base = Math::E) { 
        raise Math::DomainError, "Logarithm of non-positive number" if x <= 0
        raise Math::DomainError, "Invalid logarithm base" if base <= 0 || base == 1
        Math.log(x) / Math.log(base) 
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
        value = text.to_s.strip
        if value.match?(/^-?\d+$/)
          value.to_i
        elsif value.match?(/^-?\d*\.\d+$/)
          value.to_f
        else
          Float(value) rescue raise ArgumentError, "Cannot convert '#{value}' to number"
        end
      },
      'String' => ->(value) { 
        if value.is_a?(Float) && value == value.to_i
          value.to_i.to_s
        else
          value.to_s
        end
      },
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

  private

  def self.truthy_value?(value)
    return false if value.nil?
    return false if value == 0
    return false if value.to_s.downcase == 'false'
    return false if value.to_s.empty?
    true
  end

  def self.format_value_for_string(value)
    if value.is_a?(Float) && value == value.to_i
      value.to_i.to_s
    else
      value.to_s
    end
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

  def self.deep_equal(a, b)
    # Handle nil cases
    return true if a.nil? && b.nil?
    return false if a.nil? || b.nil?
    
    # Handle same object reference
    return true if a.equal?(b)
    
    # Handle different types
    return false unless a.class == b.class
    
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
    a == b
  end
end