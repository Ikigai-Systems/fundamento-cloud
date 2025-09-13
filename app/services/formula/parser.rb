require 'parslet'

class Formula::Parser < Parslet::Parser
  # Whitespace handling
  rule(:space) { match('\s').repeat(1) }
  rule(:space?) { space.maybe }

  # Literals
  rule(:integer) { match('[0-9]').repeat(1) }
  rule(:decimal) { integer >> str('.') >> integer }
  rule(:number) { (str('-').maybe >> (decimal | integer)).as(:number) }
  
  rule(:escaped_char) { str('\\') >> match('[bfnrt\\"\']') }
  rule(:string_content) { (escaped_char | match('[^\\\\"]')).repeat }
  rule(:string) { str('"') >> string_content.as(:string) >> str('"') }

  # Identifiers and keywords
  rule(:identifier) { match('[A-Z]') >> match('[a-zA-Z_0-9]').repeat }
  rule(:current_value) { str('CurrentValue').as(:current_value) }

  # References [identifier]
  rule(:reference) { str('[') >> identifier.as(:reference) >> str(']') }

  # Operators (order matters for >= vs >)
  rule(:comparison_op) { str('>=') | str('<=') | str('==') | str('!=') | match('[><]') }
  rule(:arithmetic_op) { match('[+\\-*/]') }
  rule(:operator) { comparison_op | arithmetic_op }

  # Function calls: Identifier(arg1, arg2, ...)
  rule(:function_call) do
    identifier.as(:function_name) >> 
    str('(') >> space? >> 
    argument_list.maybe.as(:arguments) >> 
    space? >> str(')')
  end

  rule(:argument_list) do
    expression >> (space? >> str(',') >> space? >> expression).repeat
  end

  # Terms (atomic values)
  rule(:term) do
    space? >> (
      number |
      string |
      current_value |
      reference |
      function_call.as(:function_call) |
      (str('(') >> space? >> expression >> space? >> str(')'))
    ) >> space?
  end

  # Expressions with operator precedence
  rule(:factor) { term }
  
  rule(:multiplicative) do
    factor >> (space? >> match('[*/]').as(:operator) >> space? >> factor).repeat
  end
  
  rule(:additive) do
    multiplicative >> (space? >> match('[+\\-]').as(:operator) >> space? >> multiplicative).repeat
  end
  
  rule(:comparison) do
    additive >> (space? >> comparison_op.as(:operator) >> space? >> additive).repeat
  end

  rule(:expression) { comparison.as(:expression) }

  # Top-level statement
  rule(:statement) do
    space? >> (
      function_call.as(:function_call) | 
      expression
    ) >> space?
  end

  root(:statement)
end

