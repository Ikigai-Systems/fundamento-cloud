class AttachmentsController < ApplicationController
  after_action :verify_authorized

  def show
    @attachment = current_organization.attachments.find(params[:id])

    authorize @attachment, :show?

    send_data @attachment.data, :type => @attachment.mime_type, :disposition => 'inline'
  end

  def create

    # build a photo and pass it into a block to set other attributes
    @attachment = current_organization.attachments.new(attachment_params) do |t|
      if params[:file]
        t.data      = params[:file].read
        t.filename  = params[:file].original_filename
        t.mime_type = params[:file].content_type
      end
    end

    authorize @attachment, :create?

    if @attachment.save
      render json: @attachment.as_json(:except => [:data]).merge({location: attachment_url(@attachment)}), status: :created
    else
      render json: @attachment.errors, status: :unprocessable_content
    end
  end

  def destroy
    @attachment = current_organization.attachments.find(params[:id])

    authorize @attachment, :update?

    @attachment.destroy
  end

  protected

  def attachment_params
    params.require(:attachment).permit(
      :parent_id,
      :parent_type,
    )
  end
end
