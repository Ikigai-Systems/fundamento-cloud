class Formula::ActionExecutor
  attr_reader :actions

  def initialize(dry_mode: true, space: nil, organization_user: nil, additional_context: {})
    @actions = []
    @dry_mode = dry_mode
    @space = space
    @organization_user = organization_user
    @additional_context = additional_context
    
    if !@dry_mode
      raise ArgumentError, "space is required when dry_mode is false" unless @space
      raise ArgumentError, "organization_user is required when dry_mode is false" unless @organization_user
      @pundit_user = PolicyUserContext.new(@organization_user.user, @organization_user.organization)
    end
  end

  # Record an action execution
  def record_action(type, **kwargs)
    @actions << {
      type: type,
      **kwargs
    }
  end

  # Get all recorded actions
  def get_actions
    @actions.dup
  end

  # Clear all recorded actions
  def clear
    @actions.clear
  end

  # Check if any actions were recorded
  def has_actions?
    @actions.any?
  end

  # Get available action functions for the evaluator
  def get_action_functions
    {
      'AddRow' => ->(function_context, table_npi, *args) {
        values = Hash[*args]
        add_row(function_context, table_npi, values)
      },
      'DeleteRows' => ->(function_context, table_npi) {
        delete_rows(function_context, table_npi)
      },
      'UpdateRows' => ->(function_context, table_npi, condition_formula, *args) {
        values = Hash[*args]
        update_rows(function_context, table_npi, condition_formula, values)
      },
      'AddOrUpdateRows' => ->(function_context, table_npi, condition_formula, *args) {
        values = Hash[*args]
        add_or_update_rows(function_context, table_npi, condition_formula, values)
      },
      'RunActions' => ->(function_context, *args) {
        run_actions(function_context, *args)
      }
    }
  end

  # Public action methods for direct use in tests
  def add_row(function_context, table_npi, values = {})
    record_action("AddRow", tableNpi: table_npi, values: values)
    
    unless @dry_mode
      execute_add_row(function_context, table_npi, values:)
    end
    
    true
  end

  def delete_rows(function_context, table_npi)
    record_action("DeleteRows", tableNpi: table_npi)
    
    unless @dry_mode
      execute_delete_rows(function_context, table_npi)
    end
    
    true
  end

  def update_rows(function_context, table_npi, condition_formula, values = {})
    record_action("UpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    
    unless @dry_mode
      execute_update_rows(function_context, table_npi, condition_formula:, values:)
    end
    
    true
  end

  def add_or_update_rows(function_context, table_npi, condition_formula, values = {})
    record_action("AddOrUpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    
    unless @dry_mode
      execute_add_or_update_rows(function_context, table_npi, condition_formula:, values:)
    end
    
    true
  end

  def run_actions(function_context, *args)
    # RunActions doesn't record its own action, just passes through
    true
  end

  private

  # Execution methods (copied from ExecuteActionsService)
  def execute_add_row(function_context, table_npi, values:)
    table = find_table(table_npi)

    Pundit.authorize(@pundit_user, table, :update?)

    row = table.rows.create!(
      organization: @organization_user.organization,
      previous_row: table.rows_in_order.last
    )
    
    values.each do |column_identifier, value|
      # Try to find column by NPI first, then by name
      column = table.columns.find_by(id: column_identifier) || table.columns.find_by(name: column_identifier)
      next unless column

      context = build_row_context(function_context, row)
      evaluated_value = evaluate_new_value_formula(value, context)
      
      row.cells.create!(
        column: column,
        value: evaluated_value,
        organization: @organization_user.organization,
        table: table
      )
    end
  end

  def execute_delete_rows(function_context, table_npi)
    table = find_table(table_npi)
    Pundit.authorize(@pundit_user, table, :update?)
    
    # Handle foreign key constraints by clearing previous_row_id references first
    table.rows.update_all(previous_row_id: nil)
    table.rows.destroy_all
  end

  def execute_update_rows(function_context, table_npi, condition_formula:, values:)
    table = find_table(table_npi)
    Pundit.authorize(@pundit_user, table, :update?)

    table.rows.each do |row|
      context = build_row_context(function_context, row)
      
      if evaluate_condition(condition_formula, context)
        values.each do |column_identifier, value|
          column = table.columns.find_by(id: column_identifier) || table.columns.find_by(name: column_identifier)
          next unless column

          evaluated_value = evaluate_new_value_formula(value, context)
          
          cell = row.cells.find_or_create_by(column: column) do |new_cell|
            new_cell.organization = @organization_user.organization
            new_cell.table = table
          end
          cell.update!(value: evaluated_value)
        end
      end
    end
  end

  def execute_add_or_update_rows(function_context, table_npi, condition_formula:, values:)
    table = find_table(table_npi)
    Pundit.authorize(@pundit_user, table, :update?)

    matching_rows = []
    
    table.rows_in_order.each do |row|
      context = build_row_context(function_context, row)
      
      if evaluate_condition(condition_formula, context)
        matching_rows << row
      end
    end
    
    if matching_rows.empty?
      # Add new row
      row = table.rows.create!(
        organization: @organization_user.organization,
        previous_row: table.rows_in_order.last
      )
      
      values.each do |column_identifier, value|
        column = table.columns.find_by(id: column_identifier) || table.columns.find_by(name: column_identifier)
        next unless column

        context = build_row_context(function_context, row)
        evaluated_value = evaluate_new_value_formula(value, context)
        
        row.cells.create!(
          column: column,
          value: evaluated_value,
          organization: @organization_user.organization,
          table: table
        )
      end
    else
      # Update existing rows
      matching_rows.each do |row|
        context = build_row_context(function_context, row)
        
        values.each do |column_identifier, value|
          column = table.columns.find_by(id: column_identifier) || table.columns.find_by(name: column_identifier)
          next unless column

          evaluated_value = evaluate_new_value_formula(value, context)
          
          cell = row.cells.find_or_create_by(column: column) do |new_cell|
            new_cell.organization = @organization_user.organization
            new_cell.table = table
          end
          cell.update!(value: evaluated_value)
        end
      end
    end
  end

  def find_table(table_identifier)
    # Try to find by NPI first, then by name
    table = @space.tables.find_by(id: table_identifier) || @space.tables.find_by(name: table_identifier)
    
    # Raise exception if table not found to match expected behavior
    raise ActiveRecord::RecordNotFound, "Table not found: #{table_identifier}" unless table
    
    table
  end

  def build_row_context(function_context, row)
    # Start with the function context if available, otherwise use additional_context
    context = (function_context || @additional_context).dup
    
    current_row = {}

    # Include row identifiers
    current_row["id"] = row.id
    current_row["npi"] = row.id

    row.cells.includes(:column).each do |cell|
      current_row[cell.column.name] = cell.value
    end
    
    context["currentRow"] = current_row
    context
  end

  def evaluate_condition(formula, context)
    # If no condition provided, return true (apply to all rows)
    return true if formula.nil? || (formula.is_a?(String) && formula.empty?)
    
    # Get default functions
    functions = Formula::DefaultFunctions.get_functions.dup
    
    # Add fundamento functions if available
    if @space && @organization_user
      pundit_user = PolicyUserContext.new(@organization_user)
      fundamento_functions = Formula::FundamentoFunctions.new(pundit_user: pundit_user, space: @space)
      functions.merge!(fundamento_functions.functions)
    end

    # Add context functions (including CurrentRow)
    if context.present?
      functions.merge!(Formula::DefaultFunctions.context_functions(context))
    end
    
    # Create evaluator directly to handle AST nodes
    evaluator = Formula::Evaluator.new(context:, functions:)
    
    # Set context variables
    context.keys.each { |name| evaluator.set_variable(name, context[name]) }
    
    # Handle both string formulas and AST nodes
    result = if formula.is_a?(String)
      # Parse and evaluate string formula
      begin
        parser = Formula::Parser.new
        transform = Formula::Transform.new
        parse_tree = parser.parse(formula)
        ast = transform.apply(parse_tree)
        evaluator.evaluate(ast)
      rescue Parslet::ParseFailed => e
        raise "Parse error: #{e.parse_failure_cause.ascii_tree}"
      end
    else
      # Evaluate AST node directly
      evaluator.evaluate(formula)
    end
    
    # Convert result to boolean
    case result
    when true, false
      result
    when 0, 0.0
      false
    else
      true
    end
  end

  def evaluate_new_value_formula(value, context)
    if value.is_a?(String) && value.match?(/^[A-Za-z_][A-Za-z0-9_]*\(/)
      # Create engine with only fundamento functions (no action functions to avoid recursion)
      additional_functions = {}
      
      # Add fundamento functions if available
      if @space && @organization_user
        pundit_user = PolicyUserContext.new(@organization_user)
        fundamento_functions = Formula::FundamentoFunctions.new(pundit_user: pundit_user, space: @space)
        additional_functions.merge!(fundamento_functions.functions)
      end
      
      engine = Formula::Engine.new(additional_functions: additional_functions)
      engine.evaluate(value, context: context)
    elsif value.respond_to?(:type) || value.is_a?(Hash) 
      # This might be an AST node - evaluate it directly
      # Create evaluator with all functions
      functions = Formula::DefaultFunctions.get_functions.dup
      
      # Add fundamento functions if available
      if @space && @organization_user
        pundit_user = PolicyUserContext.new(@organization_user)
        fundamento_functions = Formula::FundamentoFunctions.new(pundit_user: pundit_user, space: @space)
        functions.merge!(fundamento_functions.functions)
      end
      
      # Add context functions
      if context.present?
        functions.merge!(Formula::DefaultFunctions.context_functions(context))
      end
      
      evaluator = Formula::Evaluator.new(context: context, functions: functions)
      
      # Set context variables
      context.keys.each { |name| evaluator.set_variable(name, context[name]) }
      
      evaluator.evaluate(value, context["currentRow"])
    else
      value
    end
  end
end