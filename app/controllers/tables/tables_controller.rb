class Tables::TablesController < ApplicationController
  def index
    all_tables = current_organization.spaces.each_with_object([]) do |space, all_tables|
      all_tables.concat(space.tables)
    end

    render json: all_tables
  end
end