class Formula::Engine
  def initialize
    @parser = Formula::Parser.new
    @transform = Formula::Transform.new
  end

  # Parse and evaluate a formula string
  def evaluate(formula, context: {}, current_value: nil, action_tracker: nil)
    # Create evaluator with action tracker if provided
    evaluator = Formula::Evaluator.new(context:, action_tracker:)

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
  def evaluate_file(filename, context = {}, current_value = nil, action_tracker = nil)
    formula = File.read(filename)
    evaluate(formula, context, current_value, action_tracker)
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