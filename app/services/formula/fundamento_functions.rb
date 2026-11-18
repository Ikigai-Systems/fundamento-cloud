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
    if reading.any? { |id, _| id == table.id }
      names = reading.drop_while { |id, _| id != table.id }.map(&:last) + [table.name]
      raise "Circular reference: #{names.join(" -> ")}"
    end

    reading.push([table.id, table.name])
    begin
      Tables::RowReader.new(table, evaluate_as: @pundit_user.organization_membership).typed_rows
    ensure
      reading.pop
    end
  end
end
