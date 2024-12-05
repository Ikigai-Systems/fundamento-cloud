class TablesNoAuth::TablesController < ActionController::Base
  def show
    @table = Table.find(params[:id])

    respond_to do |format|
      # ad json format: as an exception, frontend won't use camelCase -> snake_case deserialization of response payload from this endpoint
      format.json { render json: { table: @table.attributes.except("space_id").merge({space_npi: @table.space.npi}), data: @table.data_to_json(evaluate_formulas: true) } }
      format.all { head :unprocessable_content }
    end
  end

end