class Formula::FundamentoFunctions
  def initialize(pundit_user:, space:)
    @pundit_user = pundit_user
    @space = space
  end

  def functions
    {
      "User" => method(:user_function),
      "Organization" => method(:organization_function),
      "Table" => method(:table_function),
    }.freeze
  end

  private

  def user_function(*args)
    if args.blank?
      UserBlueprint.render_as_hash(@pundit_user.user, view: :formula)
    end
  end

  def organization_function(*args)
    OrganizationBlueprint.render_as_hash(@pundit_user.current_organization, view: :formula)
  end

  # Tables being read right now by Table(), so a table that reads itself, directly or through
  # another table, is an error and not a stack overflow.
  def table_function(*args)
    table = Formula::TableLookup.new(space: @space, pundit_user: @pundit_user).find!(args[0])

    reading = (Thread.current[:formula_tables_being_read] ||= [])
    if reading.include?(table.id)
      raise "Circular reference: #{(reading.drop_while { |id| id != table.id } + [table.id]).map { |id| Table.find(id).name }.join(" -> ")}"
    end

    reading.push(table.id)
    begin
      table.data_to_hash(evaluate_formulas: true, evaluate_as: @pundit_user.organization_membership)
    ensure
      reading.pop
    end
  end
end
