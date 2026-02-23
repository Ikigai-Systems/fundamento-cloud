class Api::V1::TablesController < Api::ApiController

  def show
    @table = self.class.find_relevant_table(
      params[:id],
      params.dig("evaluationContext", "space_id"),
      current_organization_membership,
      for_update: false
    )

    render json: {
      table: @table.attributes,
      data: TableDataBlueprint.render(@table.data_to_json(evaluate_formulas: true, evaluate_as: current_organization_membership))
    }
  end

  def self.find_relevant_table(id_or_name, space_id, organization_membership, for_update: true)
    space = Space.find(space_id)

    pundit_user = PolicyUserContext.new(organization_membership.user, organization_membership.organization)

    # Will throw if unauthorized
    Pundit.authorize(pundit_user, space, for_update ? :update? : :show?)

    table = space.tables.find_by(id: id_or_name)

    if table.nil? # maybe it was table Name provided instead of id?
      table = space.tables.find_by_name!(id_or_name)
    end

    # Will throw if unauthorized
    Pundit.authorize(pundit_user, table, for_update ? :update? : :show?)

    return table
  end
end