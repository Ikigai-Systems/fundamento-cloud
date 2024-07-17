class DocumentsController < ApplicationController
  layout "full_width_application"

  def edit
    @document = Document.find(params[:id])

    @space = Space.find(params[:space_id])
    @documents = Document.find(@space.hierarchy || [])
  end

  #todo:
  # def update
  #   @document = Document.find(params[:id])
  #
  #   if @document.update_attributes(params[:document])
  #     redirect_to edit_document_path(@document), notice: "Document was successfully updated."
  #   else
  #     render :edit
  #   end
  #
  #   # respond_to do |format|
  #   #   if @comment.update_attributes(params[:comment])
  #   #     format.html { redirect_to @comment, notice: 'Comment was successfully updated.' }
  #   #     format.json { head :no_content }
  #   #   else
  #   #     format.html { render action: "edit" }
  #   #     format.json { render json: @comment.errors, status: :unprocessable_entity }
  #   #   end
  #   # end
  # end
end
