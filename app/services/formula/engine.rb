class Formula::Engine
  def initialize(additional_functions: nil)
    @parser = Formula::Parser.new
    @transform = Formula::Transform.new
    @additional_functions = additional_functions
  end

  # Parse and evaluate a formula string
  def evaluate(formula, context: {}, current_value: nil, action_executor: nil, additional_functions: @additional_functions)
    # Get default functions
    functions = Formula::DefaultFunctions.get_functions.dup

    if additional_functions.present?
      functions.merge!(additional_functions)
    end

    if context.present?
      functions.merge!(Formula::DefaultFunctions.context_functions(context))
    end
    
    # Create evaluator with functions and action executor
    evaluator = Formula::Evaluator.new(context:, functions:, action_executor:)

    # Set context variables (avoid modifying hash during iteration)
    context.keys.each { |name| evaluator.set_variable(name, context[name]) }
    
    # Parse the formula
    parse_tree = @parser.parse(formula)
    
    # Transform to AST
    ast = @transform.apply(parse_tree)
    
    # Evaluate
    evaluator.evaluate(ast, current_value)
  rescue Parslet::ParseFailed => e
    raise "Parse error: #{e.parse_failure_cause.ascii_tree}"
  end

  # Parse a file containing formulas
  def evaluate_file(filename, context: {}, current_value: nil, action_executor: nil, additional_functions: nil)
    formula = File.read(filename)
    evaluate(formula, context:, current_value:, action_executor:, additional_functions:)
  end

  # Add custom functions
  def add_function(name, &block)
    @evaluator.add_function(name, &block)
  end

  # Parse only (for validation)
  def parse(formula)
    parse_tree = @parser.parse(formula)
    @transform.apply(parse_tree)
  end

  # Parse file only
  def parse_file(filename)
    formula = File.read(filename)
    parse(formula)
  end
end