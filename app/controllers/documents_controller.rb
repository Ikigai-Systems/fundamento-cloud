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

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy
  end

  def create
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @document = current_organization.documents.new(document_params)

    if @document.save
      @space.hierarchy = (@space.hierarchy || []) + [{"id" => @document.id, "children" => []}]
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

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy
  end

  def update
    @document = current_organization.documents.find(params[:id])
    update_params = document_params
    @document.update(update_params)
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
    document_id = params[:id].to_i
    @document = current_organization.documents.find(document_id)
    @document.destroy

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])

    def safely_remove_from_hierarchy(node, document_id)
      node.each_with_index do |item, index|
        if item["id"] == document_id
          node.delete_at(index)
          item["children"].each do |child|
            node.insert(index, child)
          end
        end
        safely_remove_from_hierarchy(item["children"], document_id)
      end
    end

    safely_remove_from_hierarchy(@space.hierarchy, document_id)

    @space.save

    redirect_to space_path(@space), notice: 'Document was successfully deleted.'
  end

  private

  def document_params
    params.require(:document).permit(:title, :space_id, :space_npi, :archived)
  end
end
