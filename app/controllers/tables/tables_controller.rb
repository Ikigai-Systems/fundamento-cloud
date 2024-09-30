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

      redirect_to edit_space_table_path(@space, @table), notice: "Table created"
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

  def update_by_rowstack
    # note: as an exception, frontend doesn't use camelCase -> snake_case serialization of request payload before sending it to this endpoint
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :update?, policy_class: DocumentPolicy

    event = params[:event]
    event_type = event["type"]

    case event_type
    when "update_row"
      row = @table.rows.find_by(npi: event["rowId"])
      event["update"].each do |column_npi, new_cell_value|
        @table.columns.find_by(npi: column_npi).cells.find_by(row_id: row).update(value: new_cell_value)
      end
    when "update_rows"
      event["rows"].each do |event_row|
        row = @table.rows.find_by(npi: event_row["rowId"])
        event_row["update"].each do |column_npi, new_cell_value|
          @table.columns.find_by(npi: column_npi).cells.find_by(row_id: row).update(value: new_cell_value)
        end
      end
    when "add_row"
      row_npi = event["rowId"]
      last_row = @table.rows_in_order.last
      new_row = @table.rows.create!(
        previous_row: last_row,
        organization_id: @table.organization_id,
        npi: row_npi
      )
      @table.columns.each do |column|
        new_row.cells.create!(
          table: @table,
          column: column,
          # value: value, # todo: maybe in event["update"]["data"] there is prefilled value, handle that
          organization_id: @table.organization_id,
        )
      end
    when "delete_rows"
      event["rows"][0].each do |row_npi|
        row = @table.rows.find_by(npi: row_npi)
        next_row = row.next_row
        next_row.update(previous_row: row.previous_row) unless next_row.nil?
        row.destroy
      end
    when "add_column"
      update = event["update"]
      last_column = @table.columns_in_order.last # todo: handle "position" in event payload
      new_column = @table.columns.create!(
        previous_column: last_column,
        organization_id: @table.organization_id,
        npi: event["colId"],
        name: update["name"],
        kind: 0 # todo: map Rowstack "text" "number" "select" etc into backend's "kind" enum
      )
      @table.rows.each do |row|
        new_column.cells.create!(
          table: @table,
          row: row,
          # value: value, # todo: maybe in event["update"]["data"] there is prefilled value, handle that
          organization_id: @table.organization_id,
        )
      end
    when "update_column"
      column = @table.columns.find_by(npi: event["colId"])
      update = event["update"]

      column.name = update["name"] if update.has_key?("name")
      column.kind = Tables::Column::to_kind(update["type"]) if update.has_key?("type")
      column.save! if column.changed?
    when "delete_column"
      column = @table.columns.find_by(npi: event["colId"])
      next_column = column.next_column
      next_column.update(previous_column: column.previous_column) unless next_column.nil?
      column.destroy
    else
      raise "Unrecognized rowstack update event type: #{event_type}"
    end

    respond_to do |format|
      format.json { render json: {} }
      format.all { head :unprocessable_content }
    end
  end

  private

  def table_params
    params.require(:table).permit(:name)
  end

end