class Formula::ActionTracker
  attr_reader :actions

  def initialize
    @actions = []
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
      'AddRow' => method(:add_row),
      'DeleteRows' => method(:delete_rows),
      'UpdateRows' => method(:update_rows),
      'AddOrUpdateRows' => method(:add_or_update_rows),
      'RunActions' => method(:run_actions)
    }
  end

  private

  def add_row(table_npi, *args)
    values = Hash[*args]
    record_action("AddRow", tableNpi: table_npi, values: values)
    true
  end

  def delete_rows(table_npi)
    record_action("DeleteRows", tableNpi: table_npi)
    true
  end

  def update_rows(table_npi, condition_formula, *args)
    values = Hash[*args]
    record_action("UpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    true
  end

  def add_or_update_rows(table_npi, condition_formula, *args)
    values = Hash[*args]
    record_action("AddOrUpdateRows", tableNpi: table_npi, conditionFormula: condition_formula, values: values)
    true
  end

  def run_actions(*args)
    # RunActions doesn't record its own action, just passes through
    true
  end
end