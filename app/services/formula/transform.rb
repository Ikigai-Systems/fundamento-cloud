require 'parslet'

# Transform the parse tree into a more usable AST
class Formula::Transform < Parslet::Transform
  rule(number: simple(:x)) { Formula::Numbers.parse(x.to_s) }
  rule(string: simple(:x)) { 
    str = x.to_s
    str.gsub(/\\(.)/) do |match|
      case $1
      when 'n' then "\n"
      when 'r' then "\r"
      when 't' then "\t"
      when 'b' then "\b"
      when 'f' then "\f"
      when '"' then '"'
      when "'" then "'"
      when '\\' then '\\'
      else $1  # Return the character as-is if not a known escape
      end
    end
  }
  rule(string: subtree(:x)) { 
    str = Array(x).join
    str.gsub(/\\(.)/) do |match|
      case $1
      when 'n' then "\n"
      when 'r' then "\r"
      when 't' then "\t"
      when 'b' then "\b"
      when 'f' then "\f"
      when '"' then '"'
      when "'" then "'"
      when '\\' then '\\'
      else $1  # Return the character as-is if not a known escape
      end
    end
  }
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

  # Binary operations arrive from infix_expression as nested { l:, o:, r: } nodes
  rule(l: subtree(:left), o: simple(:operator), r: subtree(:right)) do
    { type: :binary_op, operator: operator.to_s.strip, left: left, right: right }
  end

  rule(expression: subtree(:expr)) { expr }
end
