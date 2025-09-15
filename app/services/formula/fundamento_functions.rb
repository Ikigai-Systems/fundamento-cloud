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

  def table_function(*args)
    table = Api::V1::TablesController::find_relevant_table(args[0], @space.npi, @pundit_user.organization_user, for_update: false)

    {
      table: table.attributes.except("space_id").merge({space_npi: table.space.npi}),
      data: table.data_to_json(evaluate_formulas: true, evaluate_as: @pundit_user.organization_user)
    }
  end
end