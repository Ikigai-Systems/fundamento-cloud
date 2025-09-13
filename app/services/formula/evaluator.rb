class Formula::Evaluator
  def initialize(context = {})
    @context = context
    @functions = default_functions
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

  def truthy_value?(value)
    return false if value.nil?
    return false if value == 0
    return false if value.to_s.downcase == 'false'
    true
  end

  def format_value_for_string(value)
    if value.is_a?(Float) && value == value.to_i
      value.to_i.to_s
    else
      value.to_s
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
        @current_value
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
    arguments = (node[:arguments] || []).map { |arg| eval_node(arg) }
    
    function = @functions[function_name]
    raise "Undefined function: #{function_name}" unless function
    
    function.call(*arguments)
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
      'If' => ->(condition, true_val, false_val) { condition ? true_val : false_val },
      'Sum' => ->(*args) { args.sum },
      'Average' => ->(*args) { args.sum.to_f / args.length },
      'Sqrt' => ->(x) { Math.sqrt(x) },
      'Power' => ->(base, exp) { base ** exp },
      'Log' => ->(x, base = Math::E) { 
        raise Math::DomainError, "Logarithm of non-positive number" if x <= 0
        raise Math::DomainError, "Invalid logarithm base" if base <= 0 || base == 1
        Math.log(x) / Math.log(base) 
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
      }
    }
  end
end