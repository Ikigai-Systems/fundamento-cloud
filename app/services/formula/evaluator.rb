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
      'Log' => ->(x, base = Math::E) { Math.log(x) / Math.log(base) }
    }
  end
end