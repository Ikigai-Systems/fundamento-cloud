class Formula::ExecuteActionsService
  def initialize(actions, space, organization_user, additional_context = {})
    @actions = actions
    @space = space
    @organization_user = organization_user
    @additional_context = additional_context
    @pundit_user = PolicyUserContext.new(organization_user.user, organization_user.organization)
  end

  def call
    @actions.each do |action|
      case action[:type]
      when "AddRow"
        execute_add_row(action)
      when "DeleteRows"
        execute_delete_rows(action)
      when "AddOrUpdateRows"
        execute_add_or_update_rows(action)
      when "UpdateRows"
        execute_update_rows(action)
      else
        Rails.logger.warn "Failed to execute action: unrecognized action type `#{action[:type]}`"
      end
    end
  end

  private

  def find_table(table_npi)
    table = @space.tables.find_by_npi(table_npi)
    
    if table.nil? # maybe it was table Name provided instead of id?
      table = @space.tables.find_by_name!(table_npi)
    end

    # Will throw if unauthorized
    Pundit.authorize(@pundit_user, table, :update?)

    table
  end

  def execute_add_row(action)
    table = find_table(action[:tableNpi])
    table.add_row(nil, action[:values])
  end

  def execute_delete_rows(action)
    table = find_table(action[:tableNpi])
    Tables::DeleteRowsService.new(table).call
  end

  def execute_add_or_update_rows(action)
    table = find_table(action[:tableNpi])
    condition_formula = action[:conditionFormula]

    rows_to_update = if condition_formula.nil?
                       table.rows
                     else
                       evaluate_condition_on_rows(table, condition_formula)
                     end

    if rows_to_update.empty?
      table.add_row(nil, action[:values])
    else
      update_rows_values(rows_to_update, table, action[:values])
    end
  end

  def execute_update_rows(action)
    table = find_table(action[:tableNpi])
    condition_formula = action[:conditionFormula]

    rows_to_update = if condition_formula.nil?
                       table.rows
                     else
                       evaluate_condition_on_rows(table, condition_formula)
                     end

    update_rows_values(rows_to_update, table, action[:values]) unless rows_to_update.empty?
  end

  def evaluate_condition_on_rows(table, condition_formula)
    engine = Formula::Engine.new
    rows_matching_condition = []

    table.rows.each do |row|
      cells = row.cells.index_by(&:column_id)
      current_row_values = table.columns.each_with_object({}) do |column, hash|
        hash[column.name] = cells[column.id]&.value
      end
      current_row_values["id"] = row.npi

      context = @additional_context.merge({
        "currentRow" => current_row_values
      })

      begin
        result = engine.evaluate(condition_formula, context:)
        rows_matching_condition << row if result == true
      rescue => e
        Rails.logger.error "Failed to evaluate condition formula '#{condition_formula}' for row #{row.id}: #{e.message}"
      end
    end

    rows_matching_condition
  end

  def update_rows_values(rows, table, values)
    return if values.empty?

    rows.each do |row|
      values.each do |column_name, column_value|
        column = table.columns.find_by(npi: column_name) || table.columns.find_by(name: column_name)
        if column.present?
          cell = row.cells.find_by(column_id: column.id)
          cell.update(value: column_value) if cell
        end
      end
    end
  end
end