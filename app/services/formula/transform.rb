require 'parslet'

# Transform the parse tree into a more usable AST
class Formula::Transform < Parslet::Transform
  rule(number: simple(:x)) { x.to_f }
  rule(string: simple(:x)) { x.to_s }
  rule(current_value: simple(:x)) { { type: :current_value } }
  rule(reference: simple(:x)) { { type: :reference, name: x.to_s } }

  rule(function_name: simple(:name), arguments: subtree(:args)) do
    # Handle arguments properly - if args is a single item, wrap it in array
    # If args is already an array, keep it as is
    arguments = case args
                when Array
                  args
                when Hash, Numeric, String, NilClass
                  args.nil? ? [] : [args]
                else
                  [args]
                end
    
    { type: :function_call, name: name.to_s, arguments: arguments }
  end

  rule(function_call: subtree(:call)) { call }

  # Handle binary operations
  rule(expression: subtree(:expr)) do
    case expr
    when Numeric, String
      expr
    when Hash
      # Single hash value (not an array of operations)
      expr unless expr.is_a?(Array)
    when Array
      # Process array of operations left-to-right
      if expr.length == 1
        expr.first
      else
        result = expr.first
        
        expr[1..-1].each do |element|
          next unless element.is_a?(Hash) && element.key?(:operator)
          
          operator = element[:operator].to_s
          # Find the value that's not the operator
          right_value = element.find { |key, _| key != :operator }&.last
          
          # Convert string numbers to floats or apply transformations
          right = if right_value.respond_to?(:to_s) && right_value.to_s.match?(/^\d+(\.\d+)?$/)
                    right_value.to_s.to_f
                  elsif right_value.respond_to?(:to_s) && element.keys.include?(:reference)
                    # Handle variable references
                    { type: :reference, name: right_value.to_s }
                  else
                    right_value
                  end
          
          result = { type: :binary_op, operator: operator, left: result, right: right }
        end
        
        result
      end
    else
      expr
    end
  end
end