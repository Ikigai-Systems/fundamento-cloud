class DocumentsController < ApplicationController
  layout "full_width_application"

  after_action :verify_authorized_or_index_scoped

  def index
    respond_to do |format|
      format.json { render json: policy_scope(current_organization.documents), :except => [:sync] }
      format.all { head :unprocessable_content }
    end
  end

  def new
    @document = current_organization.documents.new
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @document.space = @space

    authorize @document, :create?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
  end

  def create
    @document = current_organization.documents.new(document_params)
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @document.space = @space

    authorize @document, :create?

    if @document.save
      @space.hierarchy = (@space.hierarchy || []) + [{"id" => @document.id, "children" => []}]
      @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }

      if @space.save
        redirect_to edit_space_document_path(@space, @document), notice: 'Document was successfully created.'
      else
        render :new, status: :unprocessable_content
      end
    else
      render :new, status: :unprocessable_content
    end

  end

  def show
    @document = current_organization.documents.find(params[:id])

    authorize @document, :show?

    respond_to do |format|
      format.json { render json: @document, :except => [:sync] }
      format.html do
        @space = current_organization.spaces.find_by_npi!(params[:space_npi])

        if @document.versions.empty?
          redirect_to edit_space_document_path(@space, @document)
          return
        end

        @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
      end
      format.all { head :unprocessable_content }
    end
  end

  def edit
    @document = current_organization.documents.find(params[:id])

    authorize @document, :update?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
  end

  def update
    @document = current_organization.documents.find(params[:id])

    authorize @document, :update?

    update_params = document_params
    @document.update!(update_params)
    if update_params[:archived].present?
      if update_params[:archived] == "true"
        redirect_to space_path(@document.space), notice: 'Document has been archived.'
      else
        redirect_to edit_space_document_path(@document.space, @document), notice: 'Document has been restored.'
      end
      return
    end

    respond_to do |format|
      format.json { render json: @document, :except => [:sync] }
      format.html { render action: 'edit' }
    end
  end

  def destroy
    @document = current_organization.documents.find(params[:id])

    authorize @document, :destroy?

    @document.destroy

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @space.remove_single_item_from_hierarchy!(params[:id])
    @space.save

    redirect_to space_path(@space), notice: 'Document was successfully deleted.'
  end

  def select_destination
    @document = current_organization.documents.find(params[:id])

    authorize @document, :show?

    respond_to do |format|
      format.html { render partial: "select_destination" }
      format.json { render json: @document }
      format.turbo_stream
    end
  end

  def move
    @document = current_organization.documents.find(params[:id])

    authorize @document, :show?

    @source_space = @document.space
    @destination_space = current_organization.spaces.find(document_move_params[:space_id])

    item_to_move = @source_space.remove_item_with_children_from_hierarchy!(@document.id)

    @destination_space.add_item_to_hierarchy!(@destination_space.hierarchy, nil, item_to_move)

    @source_space.documents_from_hierarchy([item_to_move]).each { |document| document.update!(space: @destination_space) }

    if @source_space.save && @destination_space.save
      respond_to do |format|
        format.html { redirect_to space_path(@destination_space), notice: 'Document was successfully moved.' }
        format.json { render json: @document }
        format.turbo_stream
      end
    else
      respond_to do |format|
        format.html { render action: 'select_destination' }
        format.json { render json: @document.errors, status: :unprocessable_content }
        format.turbo_stream
      end
    end

    # if !policy(@document).update? || !policy(@document.space).update?
    #   head
    # end
    #
    # if !policy(@destination_space).update?
    #   head :unprocessable_content
    #   return
    # end


  end

  private

  def document_params
    params.require(:document).permit(:title, :archived)
  end

  def document_move_params
    params.require(:document).permit(:space_id)
  end
end
