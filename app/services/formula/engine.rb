class Formula::Engine
  def initialize
    @parser = Formula::Parser.new
    @transform = Formula::Transform.new
    @evaluator = Formula::Evaluator.new
  end

  # Parse and evaluate a formula string
  def evaluate(formula, context = {}, current_value = nil)
    # Set context variables
    context.each { |name, value| @evaluator.set_variable(name, value) }
    
    # Parse the formula
    parse_tree = @parser.parse(formula)
    
    # Transform to AST
    ast = @transform.apply(parse_tree)
    
    # Evaluate
    @evaluator.evaluate(ast, current_value)
  rescue Parslet::ParseFailed => e
    raise "Parse error: #{e.parse_failure_cause.ascii_tree}"
  end

  # Parse a file containing formulas
  def evaluate_file(filename, context = {}, current_value = nil)
    formula = File.read(filename)
    evaluate(formula, context, current_value)
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

# Example usage and testing
if __FILE__ == $0
  engine = FormulaEngine.new
  
  # Add a custom function
  engine.add_function('Double') { |x| x * 2 }
  
  puts "=== Formula Engine Demo ==="
  
  # Test basic arithmetic
  result = engine.evaluate("2 + 3 * 4")
  puts "2 + 3 * 4 = #{result}"
  
  # Test with variables
  context = { 'Price' => 100, 'Tax' => 0.08 }
  result = engine.evaluate("[Price] * (1 + [Tax])", context)
  puts "Price * (1 + Tax) = #{result}"
  
  # Test with CurrentValue
  result = engine.evaluate("CurrentValue * 1.1", {}, 50)
  puts "CurrentValue * 1.1 = #{result}"
  
  # Test function calls
  result = engine.evaluate("Max(10, 20)")
  puts "Max(10, 20) = #{result}"
  
  # Test custom function
  result = engine.evaluate("Double(21)")
  puts "Double(21) = #{result}"
  
  # Test complex expression
  result = engine.evaluate("If([Price] > 50, [Price] * 0.9, [Price])", context)
  puts "Conditional pricing = #{result}"
  
  # Test string handling
  result = engine.evaluate('"Hello " + "World"')
  puts "String concatenation = #{result}"
  
  # Demonstrate file parsing
  File.write('test_formula.txt', 'Max([Revenue], [MinTarget]) * [TaxRate]')
  file_context = { 'Revenue' => 1000, 'MinTarget' => 800, 'TaxRate' => 0.15 }
  result = engine.evaluate_file('test_formula.txt', file_context)
  puts "From file: #{result}"
  
  puts "\n=== Error Handling Demo ==="
  
  # Test parse errors
  begin
    engine.evaluate("2 + + 3")
  rescue => e
    puts "Parse error caught: #{e.message}"
  end
  
  # Test runtime errors
  begin
    engine.evaluate("10 / 0")
  rescue => e
    puts "Runtime error caught: #{e.message}"
  end
  
  # Test undefined variable
  begin
    engine.evaluate("[UndefinedVar]")
  rescue => e
    puts "Undefined variable error: #{e.message}"
  end
end