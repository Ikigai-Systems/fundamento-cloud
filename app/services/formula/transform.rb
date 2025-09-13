require 'parslet'

# Transform the parse tree into a more usable AST
class Formula::Transform < Parslet::Transform
  rule(number: simple(:x)) { x.to_f }
  rule(string: simple(:x)) { x.to_s }
  rule(current_value: simple(:x)) { { type: :current_value } }
  rule(reference: simple(:x)) { { type: :reference, name: x.to_s } }

  rule(function_name: simple(:name), arguments: subtree(:args)) do
    { type: :function_call, name: name.to_s, arguments: Array(args) }
  end

  rule(function_call: subtree(:call)) { call }

  # Handle binary operations
  rule(expression: subtree(:expr)) do
    # If it's just a single value, return it directly
    if expr.is_a?(Numeric) || expr.is_a?(String) || expr.is_a?(Hash)
      expr
    else
      # Otherwise, it's an array with operators
      if expr.is_a?(Array)
        result = expr.first
        (1...expr.length).step(2) do |i|
          operator = expr[i][:operator].to_s
          right = expr[i + 1]
          result = { type: :binary_op, operator: operator, left: result, right: right }
        end
        result
      else
        expr
      end
    end
  end
end