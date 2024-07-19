class DocumentsController < ApplicationController
  layout "full_width_application"

  def index
    respond_to do |format|
      format.json { render json: Document.from_current_organization, :except => [:sync] }
      format.all { head :unprocessable_entity }
    end
  end

  def new
    @document = Document.new

    @space = Space.find(params[:space_id])
    @documents = Document.find(@space.hierarchy || [])
  end

  def create
    @space = Space.find(params[:space_id])
    @document = current_organization.documents.new(document_params)
    # @document.space = @space #todo: migrate database to have space_id column in documents table

    if @document.save
      @space.hierarchy = (@space.hierarchy || []) + [@document.id]
      @documents = Document.find(@space.hierarchy)
      if @space.save
        redirect_to edit_space_document_path(@space, @document), notice: 'Document was successfully created.'
      else
        render :new, status: 422
      end
    else
      render :new, status: 422
    end

  end

  def edit
    @document = Document.find(params[:id])

    @space = Space.find(params[:space_id])
    @documents = Document.find(@space.hierarchy || [])
  end

  private

  def document_params
    params.require(:document).permit(:title, :space_id)
  end
end
