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

    # todo: ask if we need to protect tables and on which level, per space? per table?
    # authorize @table, :create?

    @table = @space.tables.new(table_params)
    @table.organization = @space.organization
    @table.parent = @space.home_document || @space.documents.first || nil
    @table.parent_id = 0 if @table.parent.nil?

    if @table.save
      uploaded_file = params[:table].fetch(:csv_file, nil)
      if uploaded_file.present?
        @table.import_from_csv(uploaded_file)
      end

      redirect_to space_database_path, notice: "Table created"
    else
      render "spaces/tables/new"
    end
  rescue ActiveRecord::RecordNotUnique => e
    @table.errors.add(:name, "must be unique within Space")
    render "spaces/tables/new"
  end

  def show
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])

    @table = @space.tables.find(params[:id])

    render "spaces/databases/show", layout: "full_width_application"
  end

  private

  def table_params
    params.require(:table).permit(:name)
  end

end