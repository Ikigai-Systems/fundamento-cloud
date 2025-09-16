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
      'AddRow' => ->(table_npi, *args) {
        values = Hash[*args]
        add_row(table_npi, values)
      },
      'DeleteRows' => ->(table_npi) {
        delete_rows(table_npi)
      },
      'UpdateRows' => ->(table_npi, condition_formula, *args) {
        values = Hash[*args]
        update_rows(table_npi, condition_formula, values)
      },
      'AddOrUpdateRows' => ->(table_npi, condition_formula, *args) {
        values = Hash[*args]
        add_or_update_rows(table_npi, condition_formula, values)
      },
      'RunActions' => ->(*args) {
        run_actions(*args)
      }
    }
  end

  # Public action methods for direct use in tests
  def add_row(table_npi, values = {})
    record_action("AddRow", tableNpi: table_npi, values: values)
    
    unless @dry_mode
      execute_add_row({ type: "AddRow", tableNpi: table_npi, values: values })
    end
    
    true
  end

  def delete_rows(table_npi)
    record_action("DeleteRows", tableNpi: table_npi)
    
    unless @dry_mode
      execute_delete_rows({ type: "DeleteRows", tableNpi: table_npi })
    end
    
    true
  end

  def update_rows(table_npi, condition_formula, values = {})
    record_action("UpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    
    unless @dry_mode
      execute_update_rows({ type: "UpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values })
    end
    
    true
  end

  def add_or_update_rows(table_npi, condition_formula, values = {})
    record_action("AddOrUpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    
    unless @dry_mode
      execute_add_or_update_rows({ type: "AddOrUpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values })
    end
    
    true
  end

  def run_actions(*args)
    # RunActions doesn't record its own action, just passes through
    true
  end

  private

  # Execution methods (copied from ExecuteActionsService)
  def execute_add_row(action)
    table = find_table(action[:tableNpi])

    Pundit.authorize(@pundit_user, table, :update?)

    row = table.rows.create!(organization: @organization_user.organization)
    
    action[:values].each do |column_identifier, value|
      # Try to find column by NPI first, then by name
      column = table.columns.find_by(npi: column_identifier) || table.columns.find_by(name: column_identifier)
      next unless column

      context = build_context(row)
      evaluated_value = evaluate_if_formula(value, context)
      
      row.cells.create!(
        column: column,
        value: evaluated_value,
        organization: @organization_user.organization,
        table: table
      )
    end
  end

  def execute_delete_rows(action)
    table = find_table(action[:tableNpi])
    Pundit.authorize(@pundit_user, table, :update?)
    
    # Handle foreign key constraints by clearing previous_row_id references first
    table.rows.update_all(previous_row_id: nil)
    table.rows.destroy_all
  end

  def execute_update_rows(action)
    table = find_table(action[:tableNpi])
    Pundit.authorize(@pundit_user, table, :update?)

    condition_formula = action[:conditionFormula]
    
    table.rows.each do |row|
      context = build_context(row)
      
      if evaluate_condition(condition_formula, context)
        action[:values].each do |column_identifier, value|
          column = table.columns.find_by(npi: column_identifier) || table.columns.find_by(name: column_identifier)
          next unless column

          evaluated_value = evaluate_if_formula(value, context)
          
          cell = row.cells.find_or_create_by(column: column) do |new_cell|
            new_cell.organization = @organization_user.organization
            new_cell.table = table
          end
          cell.update!(value: evaluated_value)
        end
      end
    end
  end

  def execute_add_or_update_rows(action)
    table = find_table(action[:tableNpi])
    Pundit.authorize(@pundit_user, table, :update?)

    condition_formula = action[:conditionFormula]
    matching_rows = []
    
    table.rows.each do |row|
      context = build_context(row)
      
      if evaluate_condition(condition_formula, context)
        matching_rows << row
      end
    end
    
    if matching_rows.empty?
      # Add new row
      row = table.rows.create!(organization: @organization_user.organization)
      
      action[:values].each do |column_identifier, value|
        column = table.columns.find_by(npi: column_identifier) || table.columns.find_by(name: column_identifier)
        next unless column

        context = build_context(row)
        evaluated_value = evaluate_if_formula(value, context)
        
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
        context = build_context(row)
        
        action[:values].each do |column_identifier, value|
          column = table.columns.find_by(npi: column_identifier) || table.columns.find_by(name: column_identifier)
          next unless column

          evaluated_value = evaluate_if_formula(value, context)
          
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
    table = @space.tables.find_by(npi: table_identifier) || @space.tables.find_by(name: table_identifier)
    
    # Raise exception if table not found to match expected behavior
    raise ActiveRecord::RecordNotFound, "Table not found: #{table_identifier}" unless table
    
    table
  end

  def build_context(row)
    context = @additional_context.dup
    
    current_row = {}
    row.cells.includes(:column).each do |cell|
      current_row[cell.column.name] = cell.value
    end
    
    context["currentRow"] = current_row
    context
  end

  def evaluate_condition(formula, context)
    # If no condition provided, return true (apply to all rows)
    return true if formula.nil? || formula.empty?
    
    engine = Formula::Engine.new
    result = engine.evaluate(formula, context: context)
    
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

  def evaluate_if_formula(value, context)
    if value.is_a?(String) && value.match?(/^[A-Za-z_][A-Za-z0-9_]*\(/)
      engine = Formula::Engine.new
      engine.evaluate(value, context: context)
    else
      value
    end
  end
end