class Tables::TablesController < ApplicationController
  def index
    render json: current_organization.tables
  end
end