class TablesNoAuth::TablesController < ActionController::Base
  def show
    @table = Table.find_by_id(params[:id])

    if @table.nil?
      # maybe it was table Name provided instead of id?
      evaluation_context = params["evaluationContext"]

      @space = Space.find_by_npi!(evaluation_context["space_npi"])
      # todo: ensure first the user has "view" permission to the @space
      @table = @space.tables.find_by_name!(params[:id])
    end

    respond_to do |format|
      # ad json format: as an exception, frontend won't use camelCase -> snake_case deserialization of response payload from this endpoint
      format.json { render json: { table: @table.attributes.except("space_id").merge({space_npi: @table.space.npi}), data: @table.data_to_json(evaluate_formulas: true) } }
      format.all { head :unprocessable_content }
    end
  end

end