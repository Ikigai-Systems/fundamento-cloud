class Formula::Evaluator
  def initialize(context: {}, functions: {}, action_executor: nil)
    @context = context
    @functions = functions.dup
    @current_value_stack = []
    @action_executor = action_executor
    
    # Add action functions if action executor is provided
    if @action_executor
      @action_executor.get_action_functions.each do |name, func|
        @functions[name] = func
      end
    end
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
    when nil
      nil
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
    # Check if this is an action function that needs special condition formula handling
    elsif action_function?(function_name)
      eval_action_function_call(node)
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

  def action_function?(name)
    %w[AddRow DeleteRows UpdateRows AddOrUpdateRows RunActions].include?(name)
  end

  def eval_action_function_call(node)
    function_name = node[:name]
    arguments = node[:arguments] || []
    
    evaluated_args = arguments.map.with_index do |arg, index|
      # For UpdateRows and AddOrUpdateRows, the second argument (index 1) is the condition formula
      # Don't evaluate it immediately - pass it as AST for later evaluation
      if (function_name == 'UpdateRows' || function_name == 'AddOrUpdateRows') && index >= 1
        arg  # Pass the raw AST node
      else
        eval_node(arg)  # Evaluate normally
      end
    end
    
    function = @functions[function_name]
    raise "Undefined function: #{function_name}" unless function
    
    # Pass the current evaluation context as the first argument to action functions
    function.call(@context, *evaluated_args)
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
end