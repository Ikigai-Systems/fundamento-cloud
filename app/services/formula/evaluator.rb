class Formula::Evaluator
  def initialize(context = {})
    @context = context
    @functions = default_functions
    @current_value_stack = []
  end

  def evaluate(ast, current_value = nil)
    @current_value = current_value
    eval_node(ast)
  end

  def add_function(name, &block)
    @functions[name.to_s] = block
  end

  def set_variable(name, value)
    @context[name.to_s] = value
  end

  private

  def enter_current_value_scope(value)
    @current_value_stack.push(value)
  end

  def exit_current_value_scope
    @current_value_stack.pop
  end

  def current_current_value
    @current_value_stack.last || @current_value
  end

  def truthy_value?(value)
    return false if value.nil?
    return false if value == 0
    return false if value.to_s.downcase == 'false'
    return false if value.to_s.empty?
    true
  end

  def format_value_for_string(value)
    if value.is_a?(Float) && value == value.to_i
      value.to_i.to_s
    else
      value.to_s
    end
  end

  def evaluate_expression_with_current_value(expression_ast, current_value)
    enter_current_value_scope(current_value)
    begin
      eval_node(expression_ast)
    ensure
      exit_current_value_scope
    end
  end

  def normalize_text(text, ignore_case, ignore_accents)
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

  def eval_node(node)
    case node
    when Numeric, String
      node
    when Hash
      case node[:type]
      when :current_value
        current_current_value
      when :reference
        @context[node[:name]] || raise("Undefined variable: #{node[:name]}")
      when :function_call
        eval_function_call(node)
      when :binary_op
        eval_binary_op(node)
      else
        raise "Unknown node type: #{node[:type]}"
      end
    when Array
      # Handle array of nodes (shouldn't happen in well-formed AST)
      node.map { |n| eval_node(n) }
    else
      raise "Cannot evaluate node: #{node.inspect}"
    end
  end

  def eval_function_call(node)
    function_name = node[:name]
    
    # Check if this is an iterative function that needs special CurrentValue handling
    if iterative_function?(function_name)
      eval_iterative_function_call(node)
    else
      arguments = (node[:arguments] || []).map { |arg| eval_node(arg) }
      
      function = @functions[function_name]
      raise "Undefined function: #{function_name}" unless function
      
      function.call(*arguments)
    end
  end

  def iterative_function?(name)
    %w[ForEach Filter All Any].include?(name)
  end

  def eval_iterative_function_call(node)
    function_name = node[:name]
    arguments = node[:arguments] || []
    
    raise "#{function_name} requires at least 2 arguments" if arguments.length < 2
    
    collection_arg = arguments[0]
    expression_arg = arguments[1]
    
    collection = eval_node(collection_arg)
    
    # If the expression argument is a string, parse it as a formula
    if expression_arg.is_a?(String)
      parser = Formula::Parser.new
      transformer = Formula::Transform.new
      parsed_expression = parser.parse(expression_arg)
      expression_ast = transformer.apply(parsed_expression)
    else
      expression_ast = expression_arg
    end
    
    case function_name
    when 'ForEach'
      Array(collection).map do |item|
        evaluate_expression_with_current_value(expression_ast, item)
      end
    when 'Filter'
      Array(collection).select do |item|
        evaluate_expression_with_current_value(expression_ast, item)
      end
    when 'All'
      Array(collection).all? do |item|
        evaluate_expression_with_current_value(expression_ast, item)
      end
    when 'Any'
      Array(collection).any? do |item|
        evaluate_expression_with_current_value(expression_ast, item)
      end
    else
      raise "Unknown iterative function: #{function_name}"
    end
  end

  def eval_binary_op(node)
    left = eval_node(node[:left])
    right = eval_node(node[:right])
    operator = node[:operator]

    case operator
    when '+'
      left + right
    when '-'
      left - right
    when '*'
      left * right
    when '/'
      raise "Division by zero" if right == 0
      left.to_f / right
    when '>'
      left > right
    when '>='
      left >= right
    when '<'
      left < right
    when '<='
      left <= right
    when '=='
      left == right
    when '!='
      left != right
    else
      raise "Unknown operator: #{operator}"
    end
  end

  def default_functions
    {
      'Max' => ->(a, b) { [a, b].max },
      'Min' => ->(a, b) { [a, b].min },
      'Abs' => ->(x) { x.abs },
      'Round' => ->(x, digits = 0) { x.round(digits.to_i) },
      'If' => ->(condition, true_val, false_val) { truthy_value?(condition) ? true_val : false_val },
      'Average' => ->(*args) { args.sum.to_f / args.length },
      'Sqrt' => ->(x) { Math.sqrt(x) },
      'Power' => ->(base, exp) { base ** exp },
      'Log' => ->(x, base = Math::E) { 
        raise Math::DomainError, "Logarithm of non-positive number" if x <= 0
        raise Math::DomainError, "Invalid logarithm base" if base <= 0 || base == 1
        Math.log(x) / Math.log(base) 
      },
      
      # Logical functions
      'And' => ->(arg1, arg2) { truthy_value?(arg1) && truthy_value?(arg2) },
      'Or' => ->(arg1, arg2) { truthy_value?(arg1) || truthy_value?(arg2) },
      'Not' => ->(value) { !truthy_value?(value) },
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
        formatted_args = args.flatten.map { |arg| format_value_for_string(arg) }
        formatted_args.join(delimiter.to_s) 
      },
      'Concatenate' => ->(*args) { 
        formatted_args = args.flatten.map { |arg| format_value_for_string(arg) }
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
        ignore_case_bool = truthy_value?(ignore_case)
        ignore_accents_bool = truthy_value?(ignore_accents)
        normalized_text = normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_search = normalize_text(search_text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_text.include?(normalized_search)
      },
      'EndsWith' => ->(text, suffix, ignore_case = 0, ignore_accents = 0) {
        ignore_case_bool = truthy_value?(ignore_case)
        ignore_accents_bool = truthy_value?(ignore_accents)
        normalized_text = normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_suffix = normalize_text(suffix.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_text.end_with?(normalized_suffix)
      },
      'StartsWith' => ->(text, prefix, ignore_case = 0, ignore_accents = 0) {
        ignore_case_bool = truthy_value?(ignore_case)
        ignore_accents_bool = truthy_value?(ignore_accents)
        normalized_text = normalize_text(text.to_s, ignore_case_bool, ignore_accents_bool)
        normalized_prefix = normalize_text(prefix.to_s, ignore_case_bool, ignore_accents_bool)
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
      'CountUnique' => ->(array) { 
        Array(array).uniq.length 
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

    }
  end
end