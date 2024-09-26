class Tables::TablesController < ApplicationController
  after_action :verify_authorized

  def index
    render json: current_organization.tables
  end

  def new
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.new

    authorize @table, :create?, policy_class: DocumentPolicy

    render "spaces/tables/new"
  end

  def create
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.new(table_params)

    authorize @table, :create?, policy_class: DocumentPolicy

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

    authorize @table, :show?, policy_class: DocumentPolicy

    render "spaces/databases/show", layout: "full_width_application"
  end

  def edit
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :update?, policy_class: DocumentPolicy

    render "spaces/databases/edit", layout: "full_width_application"
  end

  def destroy
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :destroy?, policy_class: DocumentPolicy

    @table.destroy

    redirect_to space_database_path(@space), notice: 'Table has been deleted.'
  end

  private

  def table_params
    params.require(:table).permit(:name)
  end

end