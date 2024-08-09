class DocumentsController < ApplicationController
  layout "full_width_application"

  def index
    respond_to do |format|
      format.json { render json: current_organization.documents, :except => [:sync] }
      format.all { head :unprocessable_content }
    end
  end

  def new
    @document = current_organization.documents.new

    @space = current_organization.spaces.find(params[:space_id])
    @documents = @space.documents_from_hierarchy
  end

  def create
    @space = current_organization.spaces.find(params[:space_id])
    @document = current_organization.documents.new(document_params)
    # @document.space = @space #todo: migrate database to have space_id column in documents table

    if @document.save
      @space.hierarchy = (@space.hierarchy || []) + [@document.id]
      @documents = @space.documents_from_hierarchy

      if @space.save
        redirect_to edit_space_document_path(@space, @document), notice: 'Document was successfully created.'
      else
        render :new, status: 422
      end
    else
      render :new, status: 422
    end

  end

  def show
    respond_to do |format|
      format.json { render json: current_organization.documents.find(params[:id]), :except => [:sync] }
      format.all { head :unprocessable_content }
    end
  end

  def edit
    @document = current_organization.documents.find(params[:id])

    @space = current_organization.spaces.find(params[:space_id])
    @documents = @space.documents_from_hierarchy
  end

  def update
    @document = current_organization.documents.find(params[:id])
    update_params = document_params
    @document.update(update_params)
    if update_params[:archived].present?
      if update_params[:archived] == "true"
        redirect_to space_path(params[:space_id]), notice: 'Document has been archived.'
      else
        redirect_to edit_space_document_path(params[:space_id], @document), notice: 'Document has been restored.'
      end
    end
  end

  def destroy
    document_id = params[:id].to_i
    @document = current_organization.documents.find(document_id)
    @document.destroy

    @space = current_organization.spaces.find(params[:space_id])
    @space.hierarchy.delete(document_id)
    @space.save

    redirect_to space_path(@space), notice: 'Document was successfully deleted.'
  end

  private

  def document_params
    params.require(:document).permit(:title, :space_id, :archived)
  end
end
