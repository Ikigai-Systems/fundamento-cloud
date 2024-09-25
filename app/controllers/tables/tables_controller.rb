class Tables::TablesController < ApplicationController
  def index
    render json: current_organization.tables
  end

  def new
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])

    @table = @space.tables.new

    render "spaces/tables/new"

    # todo: ask if we need to protect tables and on which level, per space? per table?
    # authorize @table, :create?
  end

  def create
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])

    @table = @space.tables.new(table_params)
    @table.organization = @space.organization
    @table.parent = @space.home_document || @space.documents.first || nil
    @table.parent_id = 0 if @table.parent.nil?

    # todo: ask if we need to protect tables and on which level, per space? per table?
    # authorize @table, :create?

    if @table.save
      redirect_to space_database_path, notice: "Table created"
    else
      render "spaces/tables/new"
    end
  rescue ActiveRecord::RecordNotUnique => e
    @table.errors.add(:name, "must be unique within Space")
    render "spaces/tables/new"
  end

  private

  def table_params
    params.require(:table).permit(:name)
  end

end