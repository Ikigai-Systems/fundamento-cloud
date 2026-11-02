class Api::V1::TablesController < Api::ApiController

  def show
    @table = self.class.find_relevant_table(
      params[:id],
      params.dig("evaluationContext", "space_id"),
      current_organization_membership,
      for_update: false
    )

    render json: {
      table: @table.attributes.merge("icon" => @table.icon&.as_json, "color" => @table.color),
      data: TableDataBlueprint.render(@table.data_to_json(evaluate_formulas: true, evaluate_as: current_organization_membership))
    }
  end

  def update
    table = current_organization.tables.find(params[:id])
    authorize table

    attributes = params.require(:table).permit(:name, :icon, :color)
    if attributes.values_at(:name, :icon, :color).all?(&:nil?)
      return render json: { errors: { base: "Provide a name, icon, color, or any mix" } }, status: :unprocessable_entity
    end

    table.assign_title_and_icon(title: attributes[:name], icon: attributes[:icon])
    table.assign_color(attributes[:color])
    table.save!

    render json: { id: table.id, name: table.name, icon: table.icon&.as_json, color: table.color, space_id: table.space_id }
  rescue ArgumentError => e
    render json: { errors: { base: e.message } }, status: :unprocessable_entity
  rescue ActiveRecord::RecordInvalid => invalid
    render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
  end

  def self.find_relevant_table(id_or_name, space_id, organization_membership, for_update: true)
    space = organization_membership.organization.spaces.find(space_id)

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