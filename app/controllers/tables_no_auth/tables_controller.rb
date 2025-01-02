class TablesNoAuth::TablesController < ActionController::Base
  def show
    @table = TablesNoAuth::TablesController::find_relevant_table(params[:id], params["evaluationContext"])

    respond_to do |format|
      # ad json format: as an exception, frontend won't use camelCase -> snake_case deserialization of response payload from this endpoint
      format.json { render json: { table: @table.attributes.except("space_id").merge({space_npi: @table.space.npi}), data: @table.data_to_json(evaluate_formulas: true) } }
      format.all { head :unprocessable_content }
    end
  end

  def self.find_relevant_table(npi_or_name, evaluation_context)
    @space = Space.find_by_npi!(evaluation_context["space_npi"])
    # todo: ensure first the user has "view" permission to the @space (user id should be availabble in "evaluation_context")

    table = Table.find_by_npi(npi_or_name)

    if table.nil? # maybe it was table Name provided instead of id?
      table = @space.tables.find_by_name!(npi_or_name)
    end

    return table
  end
end