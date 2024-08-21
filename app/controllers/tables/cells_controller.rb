class Tables::CellsController < ApplicationController

  before_action :load_table_row

  def index
    render json: @row.cells
  end

  protected

  def load_table_row
    @row = self.current_organization.tables.find(params[:table_id]).rows.find(params[:row_id])
  end
end