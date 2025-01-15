class Api::V1::TablesController < Api::ApiController
  skip_before_action :authenticate_user_from_api_token!
  before_action :authenticate_user_from_jwt_token!

  def show
    @table = self.class.find_relevant_table(
      params[:id],
      params.dig("evaluationContext", "space_npi"),
      current_organization_user,
      for_update: false
    )

    render json: {
      table: @table.attributes.except("space_id").merge({space_npi: @table.space.npi}),
      data: @table.data_to_json(evaluate_formulas: true, evaluate_as: current_organization_user)
    }
  end

  def self.find_relevant_table(npi_or_name, space_npi, organization_user, for_update: true)
    space = Space.find_by_npi!(space_npi)

    pundit_user = PolicyUserContext.new(organization_user.user, organization_user.organization)

    # Will throw if unauthorized
    Pundit.authorize(pundit_user, space, for_update ? :update? : :show?)

    table = space.tables.find_by_npi(npi_or_name)

    if table.nil? # maybe it was table Name provided instead of id?
      table = space.tables.find_by_name!(npi_or_name)
    end

    # Will throw if unauthorized
    Pundit.authorize(pundit_user, table, for_update ? :update? : :show?)

    return table
  end
end