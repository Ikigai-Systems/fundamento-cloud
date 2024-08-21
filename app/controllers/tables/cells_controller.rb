class Tables::CellsController < ApplicationController

  before_action :load_table_row

  def index
    render json: @row.cells
  end

  def update
    @cell = @row.find(params[:id])

    if @cell.update(update_params)
      render json: @cell.as_json(:except => [:organization_id, :table_id, :row_id, :column_id]), status: :ok
    else
      render json: @cell.errors, status: :unprocessable_content
    end
  end

  protected

  def load_table_row
    @row = self.current_organization.tables.find(params[:table_id]).rows.find(params[:row_id])
  end

  def update_params
    params.require(:cell).permit(:value)
  end
end