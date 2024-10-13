class Tables::TablesController < ApplicationController
  after_action :verify_authorized_or_index_scoped

  def index
    @tables = policy_scope(current_organization.tables.lexicographically, policy_scope_class: DocumentPolicy::Scope)
    query = params[:query]
    @tables = @tables.where.like(name: "%#{query}%") if query.present?

    respond_to do |format|
      format.json { render json: @tables }
      format.html do
        @space = current_organization.spaces.find_by_npi!(params[:space_npi])
        render "spaces/tables/index", layout: "full_width_application"
      end
    end
  end

  def new
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.new

    authorize @table, :create?, policy_class: DocumentPolicy

    render "spaces/tables/new"
  end

  def create
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    create_params = table_params
    if create_params[:name].nil?
      create_params[:name] = "Table " + Nanoid.generate(size: 4)
    end
    @table = @space.tables.new(create_params)

    authorize @table, :create?, policy_class: DocumentPolicy

    @table.organization = @space.organization
    @table.parent = @space.home_document || @space.documents.first || nil
    @table.parent_id = 0 if @table.parent.nil?

    if @table.save
      uploaded_file = params[:table].fetch(:csv_file, nil)
      if uploaded_file.present?
        @table.import_from_csv(uploaded_file)
      else
        last_column = nil
        params[:table][:columns].each do |column|
          last_column = @table.columns.create!(
            previous_column: last_column,
            organization_id: @table.organization_id,
            npi: column["id"],
            name: column["name"],
            kind: Tables::Column::to_kind(column["type"])
          )
        end
        last_row = nil
        params[:table][:rows].each do |row|
          last_row = @table.rows.create!(
            previous_row: last_row,
            organization_id: @table.organization_id,
            npi: row["id"]
          )
          @table.columns.each do |column|
            last_row.cells.create!(
              table: @table,
              column: column,
              organization_id: @table.organization_id,
              )
          end
        end
      end

      respond_to do |format|
        format.json { render json: @table }
        format.html { redirect_to edit_space_table_path(@space, @table), notice: "Table created" }
      end
    else
      respond_to do |format|
        format.json { render json: @table, status: :unprocessable_content}
        format.html { render "spaces/tables/new" }
      end
    end
  rescue ActiveRecord::RecordNotUnique => e
    @table.errors.add(:name, "must be unique within Space")
    respond_to do |format|
      format.json { render json: @table, status: :unprocessable_content }
      format.html { render "spaces/tables/new" }
    end
  end

  def show
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :show?, policy_class: DocumentPolicy

    respond_to do |format|
      # ad json format: as an exception, frontend won't use camelCase -> snake_case deserialization of response payload from this endpoint
      format.json { render json: { table: @table, data: @table.data_to_json } }
      format.html do
        @tables = @space.tables.lexicographically
        render "spaces/tables/show", layout: "full_width_application"
      end
    end
  end

  def edit
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])
    @tables = @space.tables.lexicographically

    authorize @table, :update?, policy_class: DocumentPolicy

    render "spaces/tables/edit", layout: "full_width_application"
  end

  def update
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :update?, policy_class: DocumentPolicy

    update_params = table_params
    @table.update!(update_params)

    respond_to do |format|
      format.json { render json: @table }
      format.html { render action: 'edit' }
    end
  end

  def destroy
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :destroy?, policy_class: DocumentPolicy

    @table.destroy

    redirect_to space_tables_path(@space), notice: 'Table has been deleted.'
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
        kind: Tables::Column::to_kind(update["type"])
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
      column.options = update["options"] if update.has_key?("options")
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

  def update_by_glide_data_grid
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :update?, policy_class: DocumentPolicy

    col_id = params[:col_id]
    row_id = params[:row_id]
    new_cell_value = params[:new_value]["data"]

    row = @table.rows.find_by(npi: row_id)
    @table.columns.find_by(npi: col_id).cells.find_by(row_id: row).update(value: new_cell_value)

    respond_to do |format|
      format.json { render json: {} }
      format.all { head :unprocessable_content }
    end
  end

  def update_by_react_data_grid
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @table = @space.tables.find(params[:id])

    authorize @table, :update?, policy_class: DocumentPolicy

    col_id = params[:col_id]
    row_id = params[:row_id]
    new_cell_value = params[:value]

    row = @table.rows.find_by(npi: row_id)
    @table.columns.find_by(npi: col_id).cells.find_by(row_id: row).update(value: new_cell_value)

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