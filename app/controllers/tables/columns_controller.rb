class Tables::ColumnsController < ApplicationController
  include EnsureOrganization

  before_action :load_table

  def index
    render json: @table.columns_in_order
  end

  protected

  def load_table
    @table = self.current_organization.tables.find(params[:table_id])
  end
end